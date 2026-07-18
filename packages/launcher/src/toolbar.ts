import type { Device } from "./types.ts";

/**
 * Toolbar 使用 iOS 暗色风格：#1c1c1e 背景，#0a84ff 蓝色高亮。
 * 极简布局：brand · 设备选择 · 尺寸 · spacer · reload/devtools/pin。
 */
const COLORS = {
  bg: "#1c1c1e",
  text: "#f5f5f7",
  secondary: "#8e8e93",
  accent: "#0a84ff",
  hover: "rgba(255,255,255,0.08)",
  active: "rgba(255,255,255,0.12)",
  divider: "rgba(255,255,255,0.1)",
  selectBg: "rgba(255,255,255,0.06)",
} as const;

const ICONS = {
  reload: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>`,
  devtools: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`,
} as const;

/**
 * 生成 toolbar 页面 HTML。
 *
 * 通过 `webview.expose('launcher', {...})` 注入的命名空间与 Node 侧通信。
 * Node 侧通过 `toolbarWebview.evaluateScript(...)` 调用本页面全局函数
 * `__minixUpdateState(state)` 推送状态变更。
 */
export function toolbarHtml(devices: readonly Device[], initialDevice: string): string {
  const options = devices
    .map((d) => `<option value="${escapeAttr(d.name)}">${escapeText(d.name)}</option>`)
    .join("");
  const initial = devices.find((d) => d.name === initialDevice) ?? devices[0]!;
  const devicesJson = JSON.stringify(
    devices.map((d) => ({ name: d.name, width: d.width, height: d.height })),
  );

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>minix</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        height: 100%;
        background: ${COLORS.bg};
        color: ${COLORS.text};
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC",
          "Helvetica Neue", sans-serif;
        font-size: 12px;
        user-select: none;
        -webkit-user-select: none;
        overflow: hidden;
      }
      .toolbar {
        display: flex;
        align-items: center;
        gap: 10px;
        height: 100%;
        padding: 0 10px 0 14px;
        background: ${COLORS.bg};
        border-bottom: 1px solid ${COLORS.divider};
        -webkit-app-region: drag;
      }
      button, select, .dim, .actions { -webkit-app-region: no-drag; }

      .brand {
        font-size: 12px;
        font-weight: 600;
        color: ${COLORS.secondary};
        letter-spacing: 0.6px;
      }
      .divider {
        width: 1px;
        height: 14px;
        background: ${COLORS.divider};
        flex-shrink: 0;
      }

      select {
        appearance: none;
        -webkit-appearance: none;
        background: ${COLORS.selectBg};
        color: ${COLORS.text};
        border: none;
        border-radius: 6px;
        padding: 5px 22px 5px 10px;
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
        outline: none;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='none' stroke='%238e8e93' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M1 1l4 4 4-4'/></svg>");
        background-repeat: no-repeat;
        background-position: right 8px center;
        transition: background-color 0.15s;
      }
      select:hover { background-color: ${COLORS.hover}; }
      select:active { background-color: ${COLORS.active}; }

      .dim {
        font-variant-numeric: tabular-nums;
        color: ${COLORS.secondary};
        font-size: 11px;
        flex-shrink: 0;
      }

      .spacer { flex: 1; }

      .actions {
        display: flex;
        align-items: center;
        gap: 2px;
      }
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        background: transparent;
        color: ${COLORS.secondary};
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.15s, color 0.15s;
      }
      button:hover { background: ${COLORS.hover}; color: ${COLORS.text}; }
      button:active { background: ${COLORS.active}; }
      button.active {
        background: ${COLORS.accent};
        color: #fff;
      }
      button.active:hover { background: ${COLORS.accent}; color: #fff; }
      button svg { display: block; }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <div class="brand">minix</div>
      <div class="divider"></div>
      <select id="device" title="切换设备">${options}</select>
      <div class="dim" id="dim">${initial.width} × ${initial.height}</div>
      <div class="spacer"></div>
      <div class="actions">
        <button id="reload" title="重新加载 (⌘R)">${ICONS.reload}</button>
        <button id="devtools" title="开发者工具 (F12)">${ICONS.devtools}</button>
        <button id="always-on-top" title="窗口置顶">${ICONS.pin}</button>
      </div>
    </div>
    <script>
      var $ = function (id) { return document.getElementById(id); };
      var deviceSel = $("device");
      var dimEl = $("dim");
      var reloadBtn = $("reload");
      var devtoolsBtn = $("devtools");
      var alwaysOnTopBtn = $("always-on-top");

      var DEVICES = ${devicesJson};
      function findDevice(name) {
        return DEVICES.find(function (d) { return d.name === name; }) || DEVICES[0];
      }
      function updateDim(name) {
        var d = findDevice(name);
        dimEl.textContent = d.width + " × " + d.height;
      }

      async function refreshState() {
        try {
          var results = await Promise.all([
            window.launcher.currentDevice(),
            window.launcher.url(),
            window.launcher.devtoolsOpen(),
            window.launcher.alwaysOnTop(),
          ]);
          deviceSel.value = results[0];
          updateDim(results[0]);
          devtoolsBtn.classList.toggle("active", !!results[2]);
          alwaysOnTopBtn.classList.toggle("active", !!results[3]);
        } catch (e) {}
      }

      window.__minixUpdateState = function (state) {
        if (!state) return;
        if (typeof state.device === "string") {
          deviceSel.value = state.device;
          updateDim(state.device);
        }
        if (typeof state.devtools === "boolean") {
          devtoolsBtn.classList.toggle("active", state.devtools);
        }
        if (typeof state.alwaysOnTop === "boolean") {
          alwaysOnTopBtn.classList.toggle("active", state.alwaysOnTop);
        }
      };

      deviceSel.addEventListener("change", async function () {
        await window.launcher.setDevice(deviceSel.value);
        updateDim(deviceSel.value);
      });
      reloadBtn.addEventListener("click", function () { window.launcher.reload(); });
      devtoolsBtn.addEventListener("click", async function () {
        var open = await window.launcher.toggleDevtools();
        devtoolsBtn.classList.toggle("active", !!open);
      });
      alwaysOnTopBtn.addEventListener("click", async function () {
        var onTop = await window.launcher.toggleAlwaysOnTop();
        alwaysOnTopBtn.classList.toggle("active", !!onTop);
      });

      document.addEventListener("keydown", function (e) {
        var meta = e.metaKey || e.ctrlKey;
        if (meta && e.key.toLowerCase() === "r") { e.preventDefault(); reloadBtn.click(); }
        else if (e.key === "F12") { e.preventDefault(); devtoolsBtn.click(); }
      });

      deviceSel.value = ${JSON.stringify(initial.name)};
      updateDim(${JSON.stringify(initial.name)});
      requestAnimationFrame(refreshState);
    </script>
  </body>
</html>`;
}

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeText(s).replace(/"/g, "&quot;");
}
