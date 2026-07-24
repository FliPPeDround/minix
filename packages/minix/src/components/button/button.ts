import {
  createSlot,
  defineVaporComponent,
  renderEffect,
  setInsertionState,
  setProp,
  template,
} from "@vue/runtime-vapor";
import { pushStyle } from "../../style.ts";
import buttonCss from "./button.css?inline";
import { buttonProps } from "./props.ts";

pushStyle("minix:components", buttonCss);

export default function Button() {
  const t = template(`<minix-button role="button">`);
  return defineVaporComponent({
    name: "minix-button",
    props: buttonProps,
    setup(props) {
      const view = t() as ParentNode;
      renderEffect(() => {
        setProp(view, "size", props.size);
        setProp(view, "type", props.type);
        setProp(view, "plain", props.plain);
        setProp(view, "disabled", props.disabled);
        setProp(view, "loading", props.loading);
        setProp(view, "formType", props.formType);
        setProp(view, "openType", props.openType);
      });
      setInsertionState(view, null, 0);
      createSlot();
      return view;
    },
  });
}
