import { createSlot, defineVaporComponent, setInsertionState, template } from "@vue/runtime-vapor";

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
