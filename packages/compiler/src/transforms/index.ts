import { transformSync, walkSync, ELEMENT_NODE } from "ultrahtml";
import type { ElementNode, Node } from "ultrahtml";
import { renameTag } from "./tags.ts";
import { parseEventBinding } from "./events.ts";

export { MINIX_TAGS } from "./tags.ts";

/** 去除纯 mustache 表达式外层的 {{ }} */
function stripMustache(value: string): string {
  const match = value.trim().match(/^\{\{([\s\S]+)\}\}$/);
  return match ? match[1].trim() : value;
}

/** 判断是否为纯 mustache 表达式 */
function isPureMustache(value: string): boolean {
  return /^\s*\{\{[\s\S]+\}\}\s*$/.test(value);
}

interface ForContext {
  item: string;
  index: string;
}

/**
 * wx: 指令转换表，将 WXML 指令属性映射为 Vue 指令属性。
 * 返回 [新属性名, 新属性值]，未列出的 wx:for-item / wx:for-index 由循环跳过。
 */
const WX_DIRECTIVES: Record<string, (value: string, ctx: ForContext) => [string, string]> = {
  "wx:if": (v) => ["v-if", stripMustache(v)],
  "wx:elif": (v) => ["v-else-if", stripMustache(v)],
  "wx:else": (v) => ["v-else", v],
  "wx:for": (v, ctx) => ["v-for", `(${ctx.item}, ${ctx.index}) in ${stripMustache(v)}`],
  "wx:key": (v, ctx) =>
    // wx:key 的值是循环项的属性名（如 wx:key="id" 表示 item.id），
    // 需要补上 item 前缀，否则 :key 会被解析到页面 _ctx 上
    [":key", v === "*this" ? ctx.item : `${ctx.item}.${v}`],
};

/** 转换 WXML AST 为 Vue 语法 */
function transformWxml(doc: Node): Node {
  walkSync(doc, (node) => {
    if (node.type !== ELEMENT_NODE) return;
    const element = node as ElementNode;
    element.name = renameTag(element.name);

    const attrs = element.attributes;
    const newAttrs: Record<string, string> = {};
    const forCtx: ForContext = {
      item: attrs["wx:for-item"] || "item",
      index: attrs["wx:for-index"] || "index",
    };

    for (const [key, value] of Object.entries(attrs)) {
      // wx:for-item / wx:for-index 由 wx:for 统一处理
      if (key === "wx:for-item" || key === "wx:for-index") continue;

      const directive = WX_DIRECTIVES[key];
      if (directive) {
        const [newKey, newValue] = directive(value, forCtx);
        newAttrs[newKey] = newValue;
        continue;
      }

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
