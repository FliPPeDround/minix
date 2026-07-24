declare module "*.vue" {
  import type { VaporComponent } from "@vue/runtime-vapor";
  const component: VaporComponent;
  export default component;
}
