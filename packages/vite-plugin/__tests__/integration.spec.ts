import { describe, it, expect, beforeEach } from "vite-plus/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compile } from "@minix/compiler";
import * as runtime from "@minix/runtime";
import {
  createApp,
  createPage,
  startApp,
  getCurrentPages,
  navigateTo,
  navigateBack,
  __resetMinixRuntime,
} from "@minix/runtime";
import { transformRpx } from "../src/index.ts";

/**
 * 端到端集成测试：用 fixture 小程序项目（真实 app.json / 页面四件套），
 * 手动复现插件在浏览器里做的事 ——
 *   1. compile() 编译 wxml，产物按 ESM 语义 eval（模拟浏览器模块加载）
 *   2. createApp / createPage 全局注入后执行真实 app.js / 页面 js
 *   3. startApp() 启动，验证渲染与路由
 *
 * vitest 运行时 cwd 即本包目录（jsdom 环境下 import.meta.url 不是 file 协议，不能用）
 */
const mpRoot = join(process.cwd(), "__fixtures__", "miniprogram");
const read = (p: string) => readFileSync(join(mpRoot, p), "utf-8");

/** 把 compiler 的 ESM 产物转成可调用的 render（`from 'minix'` 绑定到真 runtime） */
function compileToRender(wxml: string): runtime.RenderFn {
  const esm = compile(wxml);
  const js = esm
    .replace(/^import\s*\{([^}]+)\}\s*from\s*['"]minix['"];?/m, (_: string, specifiers: string) => {
      // import 的 `x as y` 别名语法 → 解构的 `x: y`
      const destructured = specifiers.replace(/(\w+)\s+as\s+(\w+)/g, "$1: $2");
      return `const {${destructured}} = __minix;`;
    })
    .replace(/^export\s+function\s+render/m, "function render");
  // oxlint-disable-next-line no-implied-eval -- 测试里模拟浏览器的模块加载
  return new Function("__minix", `${js}\nreturn render;`)(runtime) as runtime.RenderFn;
}

let importSeq = 0;
async function importFresh(path: string): Promise<void> {
  importSeq++;
  await import(`${join(mpRoot, path)}?t=${Date.now()}-${importSeq}`);
}

describe("小程序项目端到端（fixture）", () => {
  beforeEach(() => {
    __resetMinixRuntime();
    document.body.innerHTML = "";
  });

  it("app 启动 → 页面渲染 → navigateTo → navigateBack", async () => {
    // app.js：createApp 注入 + 执行
    const appJson = JSON.parse(read("app.json"));
    (globalThis as any).App = createApp(appJson, { wxss: transformRpx(read("app.wxss")) });
    (globalThis as any).getApp = runtime.getApp;
    await importFresh("app.js");

    // 页面：createPage 注入 + 编译 wxml + 执行页面 js
    (globalThis as any).Page = createPage("pages/index/index", {
      render: compileToRender(read("pages/index/index.wxml")),
      config: JSON.parse(read("pages/index/index.json")),
      wxss: transformRpx(read("pages/index/index.wxss")),
    });
    await importFresh("pages/index/index.js");

    (globalThis as any).Page = createPage("pages/detail/detail", {
      render: compileToRender(read("pages/detail/detail.wxml")),
      config: {},
    });
    await importFresh("pages/detail/detail.js");

    startApp();

    // 入口页：渲染 fixture data，导航栏取页面 json 标题
    expect(document.querySelector(".minix-page .msg")!.textContent).toBe("fixture index");
    expect(document.querySelector(".minix-navbar-title")!.textContent).toBe("首页");
    // app.wxss 全局注入
    expect(document.querySelector('style[data-minix-style="minix:app"]')).toBeTruthy();

    // 跳转二级页面：栈深度 2，标题回落到 app.json window 配置
    navigateTo({ url: "/pages/detail/detail" });
    expect(getCurrentPages().length).toBe(2);
    expect(document.querySelector(".minix-navbar-title")!.textContent).toBe("fixture 应用");

    navigateBack();
    expect(getCurrentPages().length).toBe(1);
    expect(document.querySelector(".minix-page .msg")!.textContent).toBe("fixture index");
  });
});
