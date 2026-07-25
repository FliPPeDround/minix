/**
 * 小程序内置组件标签清单。
 *
 * 这些标签浏览器不认识，且行为/样式与 HTML 原生标签差异较大
 * （如 image 的 mode、scroll-view 的滚动事件、input 的双向绑定语义），
 * 因此统一加 `minix-` 前缀，由 runtime 内部注册的同名 Vue Vapor 组件
 * 负责渲染对应原生元素并实现小程序语义，避免与浏览器默认样式冲突，
 * 也让用户的 WXSS 选择器（`view { ... }`）能精确匹配到对应组件。
 */
export const MINIX_TAGS = [
  "view",
  "text",
  "image",
  "icon",
  "navigator",
  "scroll-view",
  "swiper",
  "swiper-item",
  "input",
  "textarea",
  "button",
  "label",
  "form",
  "checkbox",
  "checkbox-group",
  "radio",
  "radio-group",
  "slider",
  "switch",
  "picker",
  "picker-view",
  "picker-view-column",
  "rich",
  "progress",
  "movable-area",
  "movable-view",
  "match-media",
  "canvas",
  "video",
  "audio",
  "map",
  "web-view",
  "editor",
  "cover-view",
  "cover-image",
];

const MINIX_TAG_SET = new Set(MINIX_TAGS);

/**
 * 重命名元素标签：
 * - `block` 只是逻辑包裹容器，不渲染为真实元素，映射为 Vue 的 `template`
 * - 小程序内置组件统一加 `minix-` 前缀，由 runtime 注册的同名组件实现语义
 */
export function renameTag(name: string): string {
  if (name === "block") return "template";
  if (MINIX_TAG_SET.has(name)) return "minix-" + name;
  return name;
}
