import { createSlot, defineVaporComponent, setInsertionState, template } from "@vue/runtime-vapor";
import { pushStyle } from "../../style.ts";
import textCss from "./text.css?inline";

pushStyle("minix:components", textCss);
export default function Text() {
  const t = template(`<minix-text>`);
  return defineVaporComponent({
    name: "minix-text",
    setup() {
      const view = t() as ParentNode;
      setInsertionState(view, null, 0);
      createSlot();
      return view;
    },
  });
}
