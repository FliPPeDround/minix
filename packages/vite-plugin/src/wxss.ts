import postcss, { type Plugin } from "postcss";
import { MINIX_TAGS } from "@minix/compiler";
import { transformRpx } from "./rpx.ts";

/**
 * 把 WXSS 里的 type selector（`view` / `text` / `scroll-view` ...）
 * 替换为对应的 `minix-*` 标签名，与 compiler 在 WXML 侧加的前缀对齐，
 * 保证用户在 WXSS 里写 `view { ... }`、`.container view { ... }` 等
 * 选择器能精确命中渲染出来的 `minix-view` 元素，不会与原生 HTML 标签
 * 或彼此串扰。
 *
 * 只替换选择器部分，不影响 declarations 里的字符串值（如
 * `content: "view"`），因此用 postcss 遍历 Rule 而非全文正则。
 *
 * 标签清单从 @minix/compiler 复用，与 WXML 侧的前缀规则保持单一来源。
 */

// 按长度降序排，避免正则 alternation 提前匹配短前缀
// （例如 "swiper-item" 必须排在 "swiper" 之前）
const SORTED_TAGS = [...MINIX_TAGS].sort((a, b) => b.length - a.length);
const TAG_PATTERN = SORTED_TAGS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

// type selector 边界：
// - 前面必须是选择器起点或组合符：^ 空白 > + ~ , (
//   （`.view` / `#view` / `[view]` 不会命中）
// - 后面必须是组合符或选择器片段分隔：空白 > + ~ , : [ . # ) $
//   （`view-text` / `viewx` 不会命中；`view.foo` / `view[attr]` 会命中）
const TYPE_SELECTOR_RE = new RegExp(`(^|[\\s>+~,(])(${TAG_PATTERN})(?=[\\s>+~,:[.#)]|$)`, "g");

const tagSelectorPlugin: Plugin = {
  postcssPlugin: "minix-tag-selector",
  Rule(rule) {
    rule.selector = rule.selector.replace(TYPE_SELECTOR_RE, "$1minix-$2");
  },
};

const processor = postcss([tagSelectorPlugin]);

/** 把 WXSS 选择器里的 view / text / image 等标签名替换为 minix-view 等 */
export function transformTagSelectors(css: string): string {
  return processor.process(css, { from: undefined }).css;
}

/** WXSS 完整转换：先替换标签选择器，再 rpx → vw */
export function transformWxss(css: string): string {
  return transformRpx(transformTagSelectors(css));
}
