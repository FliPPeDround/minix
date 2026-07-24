import { defineVaporComponent, template } from "@vue/runtime-vapor";
import { pushStyle } from "../../style.ts";
import imageCss from "./image.css?inline";

pushStyle("minix:components", imageCss);

export default function Image() {
  const t = template(`<img role="img" />`);
  return defineVaporComponent({
    name: "minix-image",
    setup() {
      const img = t();
      return img;
    },
  });
}
