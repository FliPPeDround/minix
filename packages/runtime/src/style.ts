/** 页面/全局 wxss 的 <style> 标签管理，按 id 注入与移除 */
const styleMap = new Map<string, HTMLStyleElement>();

export function applyStyle(id: string, css: string): void {
  let el = styleMap.get(id);
  if (!el) {
    el = document.createElement("style");
    el.setAttribute("data-minix-style", id);
    styleMap.set(id, el);
    document.head.appendChild(el);
  }
  el.textContent = css;
}

export function removeStyle(id: string): void {
  const el = styleMap.get(id);
  if (el) {
    el.remove();
    styleMap.delete(id);
  }
}

/** 清空所有注入的样式（测试用） */
export function __clearStyles(): void {
  for (const el of styleMap.values()) el.remove();
  styleMap.clear();
}

// ---------------------------------------------------------------------------
// bundle 式样式累积：多个模块各自 pushStyle 片段，最后 flushStyles 一次注入，
// 避免每个组件各产生一个 <style> 标签。

const pendingStyles = new Map<string, string[]>();

/** 累积 CSS 片段到指定 bundle，不立即注入 DOM */
export function pushStyle(id: string, css: string): void {
  let chunks = pendingStyles.get(id);
  if (!chunks) {
    chunks = [];
    pendingStyles.set(id, chunks);
  }
  chunks.push(css);
}

/** 把 bundle 内累积的所有片段合并后一次性注入（产生单个 <style>） */
export function flushStyles(id: string): void {
  const chunks = pendingStyles.get(id);
  if (chunks?.length) {
    applyStyle(id, chunks.join("\n"));
  }
  pendingStyles.delete(id);
}
