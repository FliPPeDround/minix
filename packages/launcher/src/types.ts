/**
 * 设备预设：物理尺寸为 CSS px（逻辑像素），devicePixelRatio 用于模拟高 DPI。
 * minWidth/minHeight 用于在桌面窗口中留出 toolbar 与边距，实际 webview 渲染区域按 device 尺寸。
 */
export interface Device {
  /** 设备显示名称，如 "iPhone 15 Pro" */
  name: string;
  /** 逻辑宽度（CSS px） */
  width: number;
  /** 逻辑高度（CSS px） */
  height: number;
  /** 设备像素比 */
  pixelRatio: number;
  /** 是否为触摸设备（影响 preload 中的 touch 事件模拟） */
  touch: boolean;
  /** User-Agent 字符串，注入到 navigator.userAgent */
  userAgent: string;
}

export interface LauncherOptions {
  /** dev server URL，如 http://localhost:5173/ */
  url: string;
  /** 初始设备名称（对应 DEVICES 中某项的 name），未匹配则使用默认设备 */
  device?: string;
  /** 启动时是否打开 DevTools，默认 false */
  devtools?: boolean;
  /** 启动时窗口是否置顶，默认 false */
  alwaysOnTop?: boolean;
  /** 自定义窗口标题，默认 "minix launcher" */
  title?: string;
}
