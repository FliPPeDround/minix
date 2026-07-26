import { describe, it, expect } from "vite-plus/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "@minix/compiler";
import * as vueRuntime from "vue";
import {
  App,
  setAppConfig,
  applyStyle,
  createPage,
  startApp,
  getApp,
  getCurrentPages,
  navigateTo,
  navigateBack,
} from "minix";
import { transformRpx } from "../src/index.ts";

// demo 的页面 js 把 navigateTo / navigateBack 当作小程序全局 API 调用，
// 这里挂到 globalThis 上让它们能被解析。
(globalThis as any).navigateTo = navigateTo;
(globalThis as any).navigateBack = navigateBack;

const __dirname = dirname(fileURLToPath(import.meta.url));
const demoDir = join(__dirname, "../../../playground/demo/miniprogram");
const read = (p: string) => readFileSync(join(demoDir, p), "utf-8");

function compileToRender(wxml: string) {
  const esm = compile(wxml);
  const js = esm
    .replace(/^import\s*\{([^}]+)\}\s*from\s*['"]vue['"];?/m, (_: string, specifiers: string) => {
      const destructured = specifiers.replace(/(\w+)\s+as\s+(\w+)/g, "$1: $2");
      return `const {${destructured}} = __vue;`;
    })
    .replace(/^export\s+function\s+render/m, "function render");
  // eslint-disable-next-line
  return new Function("__vue", `${js}\nreturn render;`)(vueRuntime);
}

/**
 * 注册 demo 的三个页面并启动应用。返回一个 cache，用来观察 detail 页 onLoad 收到的 query。
 *
 * 单文件单测试：vitest 给每个测试文件独立的模块上下文，因此不需要 `__reset*` 也能
 * 保证运行时状态（routes / stack / appInstance / appConfig / shell）干净。
 */
function setupDemo(detailQuery: { id: string }) {
  const appJson = JSON.parse(read("app.json"));
  setAppConfig(appJson);
  applyStyle("minix:app", transformRpx(read("app.wxss")));
  (globalThis as any).App = App;
  (globalThis as any).getApp = getApp;

  (globalThis as any).Page = createPage("pages/index/index", {
    render: compileToRender(read("pages/index/index.wxml")),
    config: JSON.parse(read("pages/index/index.json")),
    wxss: transformRpx(read("pages/index/index.wxss")),
  });

  (globalThis as any).Page = createPage("pages/profile/profile", {
    render: compileToRender(read("pages/profile/profile.wxml")),
    config: JSON.parse(read("pages/profile/profile.json")),
    wxss: transformRpx(read("pages/profile/profile.wxss")),
  });

  (globalThis as any).Page = createPage("pages/detail/detail", {
    render: compileToRender(read("pages/detail/detail.wxml")),
    config: JSON.parse(read("pages/detail/detail.json")),
    wxss: transformRpx(read("pages/detail/detail.wxss")),
  });

  // detail.js 调用 navigateBack / reLaunch 全局，已在文件顶部挂载
  startApp();
}

describe("repro: tabBar 配置后点击文章标题跳转详情", () => {
  it("点击文章卡片跳转详情（卡片本身/子元素点击，dataset.id 正确传递）", async () => {
    const detailQuery = { id: "" };
    // 注册 index / profile / detail，并在 detail onLoad 时捕获 query
    const detailJs = read("pages/detail/detail.js");
    // eslint-disable-next-line no-new-func
    const detailFactory = new Function("Page", "navigateBack", "reLaunch", detailJs);
    // 注册 detail 页：包装 onLoad 以捕获 query
    (globalThis as any).Page = createPage("pages/detail/detail", {
      render: compileToRender(read("pages/detail/detail.wxml")),
      config: JSON.parse(read("pages/detail/detail.json")),
      wxss: transformRpx(read("pages/detail/detail.wxss")),
    });

    // 注册 index / profile / detail 并启动
    const appJson = JSON.parse(read("app.json"));
    setAppConfig(appJson);
    applyStyle("minix:app", transformRpx(read("app.wxss")));
    (globalThis as any).App = App;
    (globalThis as any).getApp = getApp;

    (globalThis as any).Page = createPage("pages/index/index", {
      render: compileToRender(read("pages/index/index.wxml")),
      config: JSON.parse(read("pages/index/index.json")),
      wxss: transformRpx(read("pages/index/index.wxss")),
    });
    await import(`${join(demoDir, "pages/index/index.js")}?t=${Date.now()}-1`);

    (globalThis as any).Page = createPage("pages/profile/profile", {
      render: compileToRender(read("pages/profile/profile.wxml")),
      config: JSON.parse(read("pages/profile/profile.json")),
      wxss: transformRpx(read("pages/profile/profile.wxss")),
    });
    await import(`${join(demoDir, "pages/profile/profile.js")}?t=${Date.now()}-2`);

    (globalThis as any).Page = createPage("pages/detail/detail", {
      render: compileToRender(read("pages/detail/detail.wxml")),
      config: JSON.parse(read("pages/detail/detail.json")),
      wxss: transformRpx(read("pages/detail/detail.wxss")),
    });
    await import(`${join(demoDir, "pages/detail/detail.js")}?t=${Date.now()}-3`);

    startApp();

    expect(getCurrentPages().length).toBe(1);

    // 找到第一篇文章卡片
    const articleCards = document.querySelectorAll<HTMLElement>(".article");
    expect(articleCards.length).toBe(3);
    const firstCard = articleCards[0];

    // 场景 1：点击卡片本身 → navigateTo detail
    firstCard.click();
    expect(getCurrentPages().length).toBe(2);
    expect(getCurrentPages()[1].route).toBe("pages/detail/detail");
    // detail onLoad 收到 id=1（firstCard 的 data-id）
    expect((getCurrentPages()[1] as any).data.id).toBe("1");

    // navigateBack 恢复到 index
    navigateBack();
    expect(getCurrentPages().length).toBe(1);

    // 场景 2：点击卡片子元素（标题文本），事件冒泡到 card 触发 openDetail
    const titleText = firstCard.querySelector<HTMLElement>(".article-title")!;
    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    Object.defineProperty(clickEvent, "target", { value: titleText, configurable: true });
    titleText.dispatchEvent(clickEvent);

    expect(getCurrentPages().length).toBe(2);
    expect(getCurrentPages()[1].route).toBe("pages/detail/detail");
    expect((getCurrentPages()[1] as any).data.id).toBe("1");
  });
});
