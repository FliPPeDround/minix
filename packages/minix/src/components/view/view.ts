import { createSlot, defineVaporComponent, setInsertionState, template } from "@vue/runtime-vapor";
import { pushStyle } from "../../style.ts";
import viewCss from "./view.css?inline";

pushStyle("minix:components", viewCss);

export default function View() {
  const t = template(`<minix-view>`);
  return defineVaporComponent({
    name: "minix-view",
    setup() {
      const view = t() as ParentNode;
      setInsertionState(view, null, 0);
      createSlot();
      return view;
    },
  });
}
