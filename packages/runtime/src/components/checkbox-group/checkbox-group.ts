import {
  createSlot,
  defineVaporComponent,
  on,
  setInsertionState,
  template,
} from "@vue/runtime-vapor";
import { pushStyle } from "../../style.ts";
import checkboxGroupCss from "./checkbox-group.css?inline";

pushStyle("minix:components", checkboxGroupCss);

/**
 * checkbox-group：minix-checkbox-group 自定义元素。
 *
 * 小程序语义：作为 <checkbox> 的父容器，监听内部 checkbox 的 change 事件，
 * 收集所有 checked 的 value，向外抛 change 事件，detail.value 为数组。
 *
 * 实现方式：在容器根节点上监听 change 事件（事件冒泡），从 e.target 取
 * checkbox 的 value 与 checked，构造选中值数组。这避免了显式维护子组件
 * 列表，对运行时新增/删除 checkbox 也兼容。
 */
export default function CheckboxGroup() {
  const t = template(`<minix-checkbox-group>`);
  return defineVaporComponent({
    name: "minix-checkbox-group",
    setup(_props, ctx) {
      const view = t() as ParentNode & { querySelectorAll: Element["querySelectorAll"] };

      const collect = (): unknown[] => {
        const checked = view.querySelectorAll?.('minix-checkbox input[type="checkbox"]:checked') as
          | NodeListOf<HTMLInputElement>
          | undefined;
        const values: unknown[] = [];
        checked?.forEach((el) => {
          const val = (el as HTMLInputElement).value;
          values.push(val === "" ? true : val);
        });
        return values;
      };

      on(view as unknown as Element, "change", (e: Event) => {
        const detail = { value: collect() };
        ctx.emit?.("change", { detail });
        const fn = (ctx.attrs as any).onChange;
        if (typeof fn === "function") fn({ detail });
        // 阻止冒泡，避免外层 form 误以为是 form change
        e.stopPropagation();
      });

      setInsertionState(view, null, 0);
      createSlot();
      return view;
    },
  });
}
