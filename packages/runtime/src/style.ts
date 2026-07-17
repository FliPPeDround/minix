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
