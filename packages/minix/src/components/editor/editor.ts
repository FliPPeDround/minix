import { defineVaporComponent, on, renderEffect, template } from "@vue/runtime-vapor";
import { pushStyle } from "../../style.ts";
import editorCss from "./editor.css?inline";
import { editorProps } from "./props.ts";

pushStyle("minix:components", editorCss);

/**
 * editor：minix-editor 外壳包 contenteditable 的 div。
 *
 * 小程序语义：富文本编辑器，通过 EditorContext 暴露 format / insertXxx /
 * clear / undo / redo 等命令。浏览器侧 contenteditable 已是事实标准，
 * document.execCommand 虽被弃用但仍可用，作为富文本 API 的最简实现。
 *
 * 事件：bindready / bindfocus / bindblur / bindinput / bindstatuschange。
 * statuschange detail 包含当前光标位置可用的格式（{ formats: {...} }），
 * 本实现先抛基本字段，复杂格式探测后续补全。
 */
export default function Editor() {
  const t = template(
    `<minix-editor><div contenteditable="true" style="width:100%;height:100%;outline:0;white-space:pre-wrap;word-wrap:break-word"></div></minix-editor>`,
  );
  return defineVaporComponent({
    name: "minix-editor",
    props: editorProps,
    setup(props, ctx) {
      const n0 = t() as HTMLElement;
      const ed = n0.firstChild as HTMLDivElement;

      const fire = (name: string, detail: Record<string, any> = {}) => {
        ctx.emit?.(name, { detail });
        const fn = (ctx.attrs as any)[`on${name[0].toUpperCase()}${name.slice(1)}`];
        if (typeof fn === "function") fn({ detail });
      };

      renderEffect(() => {
        ed.contentEditable = props.readOnly ? "false" : "true";
        if (props.placeholder) ed.setAttribute("data-placeholder", props.placeholder);
        else ed.removeAttribute("data-placeholder");
      });

      // ready：第一次挂载完成触发一次
      on(n0, "attached" as any, () => fire("ready"));

      on(ed, "focus", () => fire("focus", { html: ed.innerHTML }));
      on(ed, "blur", () => fire("blur", { html: ed.innerHTML }));
      on(ed, "input", () =>
        fire("input", {
          html: ed.innerHTML,
          text: ed.textContent ?? "",
          delta: { ops: [{ insert: ed.textContent ?? "" }] },
        }),
      );

      // 暴露 ed element 供 ctx.editorContext / SelectorQuery 使用
      (n0 as any).__editorElement = ed;

      return n0;
    },
  });
}
