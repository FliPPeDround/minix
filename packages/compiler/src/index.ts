import { compile as compileVue } from "@vue/compiler-vapor";
import { transformToVue } from "./transforms/index.ts";
export { MINIX_TAGS } from "./transforms/index.ts";

/**
 * 解析 wxml，返回解析后的文档。
 * @param wxml 需要解析的 wxml 字符串。
 */
export function compile(wxml: string): any {
  const vueTemplateCode = transformToVue(wxml);
  const { code } = compileVue(vueTemplateCode, {
    mode: "module",
    prefixIdentifiers: true,
    bindingMetadata: {},
    runtimeModuleName: "minix",
  });
  return code;
}
