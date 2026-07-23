import { transformSync, walkSync, ELEMENT_NODE } from "ultrahtml";
import type { ElementNode, Node } from "ultrahtml";

/** WXML 事件名到 Vue 事件名的映射 */
const EVENT_NAME_MAP: Record<string, string> = {
  tap: "click",
  longtap: "longpress",
  longpress: "longpress",
};

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

function mapEventName(event: string): string {
  return EVENT_NAME_MAP[event] ?? event;
}

/** 去除纯 mustache 表达式外层的 {{ }} */
function stripMustache(value: string): string {
  const match = value.trim().match(/^\{\{([\s\S]+)\}\}$/);
  return match ? match[1].trim() : value;
}

/** 判断是否为纯 mustache 表达式 */
function isPureMustache(value: string): boolean {
  return /^\s*\{\{[\s\S]+\}\}\s*$/.test(value);
}

interface ParsedEvent {
  name: string;
  modifiers: string;
}

/** 解析 WXML 事件绑定，返回 Vue 事件名和修饰符 */
function parseEventBinding(key: string): ParsedEvent | null {
  if (key.startsWith("capture-catch:")) {
    return { name: mapEventName(key.slice("capture-catch:".length)), modifiers: ".capture.stop" };
  }
  if (key.startsWith("capture-bind:")) {
    return { name: mapEventName(key.slice("capture-bind:".length)), modifiers: ".capture" };
  }
  if (key.startsWith("mut-bind:")) {
    return { name: mapEventName(key.slice("mut-bind:".length)), modifiers: "" };
  }
  if (key.startsWith("mut-bind")) {
    return { name: mapEventName(key.slice("mut-bind".length)), modifiers: "" };
  }
  if (key.startsWith("catch:")) {
    return { name: mapEventName(key.slice("catch:".length)), modifiers: ".stop" };
  }
  if (key.startsWith("catch")) {
    return { name: mapEventName(key.slice("catch".length)), modifiers: ".stop" };
  }
  if (key.startsWith("bind:")) {
    return { name: mapEventName(key.slice("bind:".length)), modifiers: "" };
  }
  if (key.startsWith("bind")) {
    return { name: mapEventName(key.slice("bind".length)), modifiers: "" };
  }
  return null;
}

/** 转换 WXML AST 为 Vue 语法 */
function transformWxml(doc: Node): Node {
  walkSync(doc, (node) => {
    if (node.type !== ELEMENT_NODE) return;
    const element = node as ElementNode;

    // <block> 只是逻辑包裹容器，不渲染为真实元素，映射为 Vue 的 <template>
    if (element.name === "block") element.name = "template";
    // 小程序内置组件统一加 minix- 前缀，由 runtime 注册的同名组件实现语义
    else if (MINIX_TAG_SET.has(element.name)) {
      element.name = "minix-" + element.name;
    }

    const attrs = element.attributes;
    const newAttrs: Record<string, string> = {};

    const forItem = attrs["wx:for-item"] || "item";
    const forIndex = attrs["wx:for-index"] || "index";

    for (const [key, value] of Object.entries(attrs)) {
      // wx:for-item / wx:for-index 由 wx:for 统一处理
      if (key === "wx:for-item" || key === "wx:for-index") continue;

      // 条件渲染
      if (key === "wx:if") {
        newAttrs["v-if"] = stripMustache(value);
        continue;
      }
      if (key === "wx:elif") {
        newAttrs["v-else-if"] = stripMustache(value);
        continue;
      }
      if (key === "wx:else") {
        newAttrs["v-else"] = value;
        continue;
      }

      // 列表渲染
      if (key === "wx:for") {
        newAttrs["v-for"] = `(${forItem}, ${forIndex}) in ${stripMustache(value)}`;
        continue;
      }
      if (key === "wx:key") {
        // wx:key 的值是循环项的属性名（如 wx:key="id" 表示 item.id），
        // 需要补上 item 前缀，否则 :key 会被解析到页面 _ctx 上
        newAttrs[":key"] = value === "*this" ? forItem : `${forItem}.${value}`;
        continue;
      }

      // 事件绑定
      const event = parseEventBinding(key);
      if (event) {
        newAttrs[`@${event.name}${event.modifiers}`] = value;
        continue;
      }

      // 纯 mustache 属性值 → v-bind 绑定
      if (isPureMustache(value)) {
        newAttrs[`:${key}`] = stripMustache(value);
        continue;
      }

      newAttrs[key] = value;
    }

    element.attributes = newAttrs;
  });
  return doc;
}

/**
 * 将 wxml 转换为 vue 语法。
 * @param wxml 需要转换的 wxml 字符串。
 * @returns 转换后的 vue 语法字符串。
 */
export function transformToVue(wxml: string): string {
  return transformSync(wxml, [transformWxml]);
}
