import { createSlot, defineVaporComponent, setInsertionState, template } from "@vue/runtime-vapor";
import { pushStyle } from "../../../style.ts";
import movableAreaCss from "./movable-area.css?inline";

pushStyle("minix:components", movableAreaCss);

/**
 * movable-area：minix-movable-area 自定义元素。
 *
 * 小程序语义：定义子节点 <movable-view> 的可移动范围。movable-view 在
 * 本元素的边界内移动；当 movable-view 的 out-of-bounds=true 时也允许
 * 暂时拖出边界再回弹。
 *
 * 实现：仅作为相对定位的容器，子节点 movable-view 自行处理拖拽与边界。
 */
export default function MovableArea() {
  const t = template(`<minix-movable-area>`);
  return defineVaporComponent({
    name: "minix-movable-area",
    setup() {
      const view = t() as ParentNode;
      setInsertionState(view, null, 0);
      createSlot();
      return view;
    },
  });
}
