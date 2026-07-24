import {
  createSlot,
  defineVaporComponent,
  on,
  setInsertionState,
  template,
} from "@vue/runtime-vapor";
import { pushStyle } from "../../style.ts";
import radioGroupCss from "./radio-group.css?inline";

pushStyle("minix:components", radioGroupCss);

/**
 * radio-group：minix-radio-group 自定义元素。
 *
 * 小程序语义：作为 <radio> 的父容器，监听内部 radio 的 change 事件，
 * 把当前选中的 radio value 向外抛 change 事件，detail.value 为单值。
 *
 * 实现方式：在容器根节点上监听 change 事件（事件冒泡），从 e.target 取
 * radio 的 value。HTML 原生 radio 同名互斥，简化了选中态管理。
 */
export default function RadioGroup() {
  const t = template(`<minix-radio-group>`);
  return defineVaporComponent({
    name: "minix-radio-group",
    setup(_props, ctx) {
      const view = t() as ParentNode & { querySelector: Element["querySelector"] };

      on(view as unknown as Element, "change", (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.type !== "radio") return;
        const detail = { value: target.value === "" ? true : target.value };
        ctx.emit?.("change", { detail });
        const fn = (ctx.attrs as any).onChange;
        if (typeof fn === "function") fn({ detail });
        e.stopPropagation();
      });

      setInsertionState(view, null, 0);
      createSlot();
      return view;
    },
  });
}
