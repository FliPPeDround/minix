import { createSlot, defineVaporComponent, setInsertionState, template } from "@vue/runtime-vapor";
import { pushStyle } from "../../style.ts";
import pickerViewColumnCss from "./picker-view-column.css?inline";

pushStyle("minix:components", pickerViewColumnCss);

/**
 * picker-view-column：minix-picker-view-column 自定义元素。
 *
 * 小程序语义：<picker-view> 的子节点，表示一列可滚动的选项。列内通常
 * 是一组等高的 <view>。父级 picker-view 负责监听滚动并维护 selected index。
 *
 * 实现：仅渲染可滚动容器，把 slot 内容插入到内部。滚动与选中逻辑由
 * 父 picker-view 通过监听本列的 scroll 事件实现。
 */
export default function PickerViewColumn() {
  const t = template(`<minix-picker-view-column>`);
  return defineVaporComponent({
    name: "minix-picker-view-column",
    setup() {
      const view = t() as ParentNode;
      setInsertionState(view, null, 0);
      createSlot();
      return view;
    },
  });
}
