// 由 toolbar/vite.config.ts 构建产物，内联了所有 JS/CSS 的单文件 HTML
import toolbarHtml from "./toolbar.html?raw";

/**
 * 返回 toolbar 页面 HTML（单文件，已内联 JS/CSS）。
 *
 * 通过 `webview.expose('launcher', {...})` 注入的命名空间与 Node 侧通信。
 * Node 侧通过 `toolbarWebview.evaluateScript(...)` 调用本页面全局函数
 * `__minixUpdateState(state)` 推送状态变更。
 *
 * 设备列表、初始状态等动态信息由 Vue 应用在 mount 后通过 window.launcher
 * API 拉取，HTML 本身是静态的。
 */
export { toolbarHtml };
