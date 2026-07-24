import { it } from "vite-plus/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "@minix/compiler";
import * as runtime from "minix";

const __dirname = dirname(fileURLToPath(import.meta.url));
const demoDir = join(__dirname, "../../../playground/demo/miniprogram");

function compileToRender(wxml: string): runtime.RenderFn {
  const esm = compile(wxml);
  const js = esm
    .replace(/^import\s*\{([^}]+)\}\s*from\s*['"]minix['"];?/m, (_: string, specifiers: string) => {
      const destructured = specifiers.replace(/(\w+)\s+as\s+(\w+)/g, "$1: $2");
      return `const {${destructured}} = __minix;`;
    })
    .replace(/^export\s+function\s+render/m, "function render");
  // eslint-disable-next-line
  return new Function("__minix", `${js}\nreturn render;`)(runtime) as runtime.RenderFn;
}

it("repro: 用 demo 真实 index.wxml 渲染", () => {
  const wxml = readFileSync(join(demoDir, "pages/index/index.wxml"), "utf-8");
  console.log("=== 编译产物 ===");
  console.log(compile(wxml));
  const render = compileToRender(wxml);
  const page = runtime.createPageInstance({
    data: {
      count: 0,
      articles: [
        { id: 1, title: "为什么是 Vue Vapor", desc: "无虚拟 DOM" },
        { id: 2, title: "WXML 编译原理", desc: "模板转换" },
      ],
    },
    render,
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  page.mount(container);
  console.log("=== 渲染结果 innerHTML ===");
  console.log(container.innerHTML);
});
