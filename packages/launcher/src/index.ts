import { Application, type BrowserWindow, type Webview } from "@webviewjs/webview";
import { DEVICES, DEFAULT_DEVICE_NAME, findDevice } from "./devices.ts";
import toolbarHtml from "@minix/toolbar?raw";
import type { Device, LauncherOptions } from "./types.ts";

/** Toolbar 高度（逻辑像素），iOS Simulator 风格的紧凑条 */
const TOOLBAR_HEIGHT = 36;

/**
 * 启动原生 launcher：把 Vite dev server URL 包进一个桌面窗口，
 * 上方是一条极简的 toolbar（设备切换 / DevTools / 置顶 / reload），
 * 下方是按设备尺寸渲染的 webview。设备切换通过调整窗口大小 + 重注入 preload 实现
 * 近似的移动端模拟（UA / viewport / touch）。
 *
 * 调用方（通常是 vite-plugin）会在 dev server listen 后调用此函数。
 *
 * @example
 *   await launch({ url: "http://localhost:5173/", device: "iPhone 15 Pro" });
 */
export async function launch(options: LauncherOptions): Promise<void> {
  const url = options.url;
  if (!url) throw new Error("[minix/launcher] url is required");

  const initialDevice = findDevice(options.device);
  const initialTitle = options.title ?? "minix";

  const app = new Application();

  // 强引用，避免被 GC 回收（参见 webviewjs README "Keep strong references"）
  const refs: {
    window: BrowserWindow | null;
    toolbar: Webview | null;
    content: Webview | null;
  } = { window: null, toolbar: null, content: null };

  // 运行时状态
  const state = {
    device: initialDevice,
    alwaysOnTop: !!options.alwaysOnTop,
  };

  // 计算窗口内尺寸（content 紧贴 toolbar 下方，无额外 padding）
  function windowSizeFor(device: Device): { width: number; height: number } {
    return { width: device.width, height: TOOLBAR_HEIGHT + device.height };
  }

  // 计算 toolbar webview 的 bounds
  function toolbarBounds(windowWidth: number) {
    return { x: 0, y: 0, width: windowWidth, height: TOOLBAR_HEIGHT };
  }

  // 计算 content webview 的 bounds
  function contentBounds(windowWidth: number) {
    return {
      x: 0,
      y: TOOLBAR_HEIGHT,
      width: windowWidth,
      height: state.device.height,
    };
  }

  // 推送状态到 toolbar 页面
  function pushState(patch: Record<string, unknown>) {
    if (!refs.toolbar) return;
    try {
      refs.toolbar.evaluateScript(`window.__minixUpdateState(${JSON.stringify(patch)})`);
    } catch {
      // toolbar 未就绪或已销毁，忽略
    }
  }

  // 重新布局两个 webview（窗口 resize 或设备切换时调用）
  function relayout() {
    const win = refs.window;
    if (!win) return;
    const inner = win.getInnerSize(true);
    const w = inner.width;
    if (refs.toolbar) {
      refs.toolbar.setBounds(toolbarBounds(w));
    }
    if (refs.content) {
      refs.content.setBounds(contentBounds(w));
    }
  }

  // 应用设备切换：调整窗口尺寸 → 重新布局 → 重载 content（带新 preload）
  function applyDevice(device: Device) {
    state.device = device;
    const win = refs.window;
    if (!win) return;
    const size = windowSizeFor(device);
    win.setSize(size.width, size.height, true);
    relayout();
    // 重载 content 以应用新的 preload（UA / viewport / touch 模拟）
    if (refs.content) {
      try {
        refs.content.loadUrl(url);
      } catch {
        // 某些情况下 loadUrl 失败可忽略，下次 reload 会重试
      }
    }
    pushState({ device: device.name });
  }

  // whenReady 默认 autoRun: true，会启动非阻塞事件泵（Node timers / I/O 继续运行）
  await app.whenReady({ interval: 16, ref: true });

  const initialSize = windowSizeFor(initialDevice);

  // 窗口先不可见，等 webview 布局完成后再 show，避免初始闪烁 / content 被遮挡
  const win = app.createBrowserWindow({
    title: initialTitle,
    width: initialSize.width,
    height: initialSize.height,
    resizable: true,
    minimizable: true,
    maximizable: false,
    decorations: true,
    alwaysOnTop: state.alwaysOnTop,
    visible: false,
  });
  refs.window = win;

  // 监听窗口尺寸变化（用户手动拖拽边框），保持两个 webview 正确铺满
  win.on("resize", () => relayout());

  // 关闭窗口即退出 app
  win.on("close", () => {
    try {
      app.exit();
    } catch {
      // ignore
    }
  });

  // ── toolbar webview ─────────────────────────────────────────
  // toolbarHtml 是构建时内联好的单文件 HTML（Vue 应用），设备列表等
  // 动态信息由 Vue 应用在 mount 后通过 window.launcher API 拉取
  const toolbar = win.createWebview({
    html: toolbarHtml,
  });
  refs.toolbar = toolbar;
  // 关键：创建后立即设置 bounds，否则 toolbar 默认占满整个窗口盖住 content
  toolbar.setBounds(toolbarBounds(initialSize.width));

  // 暴露控制接口给 toolbar 页面（Vue 应用通过 window.launcher 调用）
  toolbar.expose("launcher", {
    devices: () => DEVICES.map((d) => ({ name: d.name, width: d.width, height: d.height })),
    currentDevice: () => state.device.name,
    setDevice: (name: string) => {
      const d = findDevice(name);
      applyDevice(d);
    },
    devtoolsOpen: () => !!refs.content?.isDevtoolsOpen(),
    toggleDevtools: () => {
      if (!refs.content) return false;
      try {
        if (refs.content.isDevtoolsOpen()) {
          refs.content.closeDevtools();
          pushState({ devtools: false });
          return false;
        } else {
          refs.content.openDevtools();
          pushState({ devtools: true });
          return true;
        }
      } catch {
        return false;
      }
    },
    alwaysOnTop: () => state.alwaysOnTop,
    toggleAlwaysOnTop: () => {
      state.alwaysOnTop = !state.alwaysOnTop;
      try {
        refs.window?.setAlwaysOnTop(state.alwaysOnTop);
      } catch {
        // ignore
      }
      pushState({ alwaysOnTop: state.alwaysOnTop });
      return state.alwaysOnTop;
    },
    reload: () => {
      try {
        refs.content?.reload();
      } catch {
        // ignore
      }
    },
    url: () => {
      try {
        return refs.content?.url() ?? url;
      } catch {
        return url;
      }
    },
  });

  // ── content webview ─────────────────────────────────────────
  // 用 preload 注入移动端模拟脚本（UA / viewport / touch）
  const content = win.createWebview({ url });
  refs.content = content;
  // 同样立即设置 bounds
  content.setBounds(contentBounds(initialSize.width));

  // 启动时按选项打开 DevTools
  if (options.devtools) {
    try {
      content.openDevtools();
    } catch {
      // ignore
    }
  }

  // 内容页面导航时把最新 URL 推给 toolbar
  content.on("page-load-finished", () => {
    try {
      const current = content.url();
      if (current) pushState({ url: current });
    } catch {
      // ignore
    }
  });

  // 应用退出时清理引用
  app.on("application-close-requested", () => {
    refs.window = null;
    refs.toolbar = null;
    refs.content = null;
  });

  // 布局已就位，显示窗口
  win.show();
}

export { DEVICES, DEFAULT_DEVICE_NAME, findDevice };
export type { Device, LauncherOptions } from "./types.ts";
