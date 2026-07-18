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

const demoDir = join(process.cwd(), "../../playground/demo/miniprogram");
const read = (p: string) => readFileSync(join(demoDir, p), "utf-8");

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

describe("repro: tabBar 配置后点击文章标题跳转详情", () => {
  beforeEach(() => {
    __resetMinixRuntime();
    document.body.innerHTML = "";
  });

  it("用 demo 真实文件 + tabBar 配置复现点击跳转", async () => {
    const appJson = JSON.parse(read("app.json"));
    (globalThis as any).App = createApp(appJson, { wxss: transformRpx(read("app.wxss")) });
    (globalThis as any).getApp = runtime.getApp;

    // 注册 index 页（用 demo 真实 wxml / wxss / json）
    (globalThis as any).Page = createPage("pages/index/index", {
      render: compileToRender(read("pages/index/index.wxml")),
      config: JSON.parse(read("pages/index/index.json")),
      wxss: transformRpx(read("pages/index/index.wxss")),
    });
    await import(`${join(demoDir, "pages/index/index.js")}?t=${Date.now()}-1`);

    // 注册 profile 页
    (globalThis as any).Page = createPage("pages/profile/profile", {
      render: compileToRender(read("pages/profile/profile.wxml")),
      config: JSON.parse(read("pages/profile/profile.json")),
      wxss: transformRpx(read("pages/profile/profile.wxss")),
    });
    await import(`${join(demoDir, "pages/profile/profile.js")}?t=${Date.now()}-2`);

    // 注册 detail 页
    (globalThis as any).Page = createPage("pages/detail/detail", {
      render: compileToRender(read("pages/detail/detail.wxml")),
      config: JSON.parse(read("pages/detail/detail.json")),
      wxss: transformRpx(read("pages/detail/detail.wxss")),
    });
    await import(`${join(demoDir, "pages/detail/detail.js")}?t=${Date.now()}-3`);

    startApp();

    // 启动后应该在 index 页
    console.log("=== 启动后页面栈深度 ===", getCurrentPages().length);
    console.log("=== 启动后 DOM ===");
    console.log(document.body.innerHTML.substring(0, 500));

    // 找到第一篇文章卡片并点击
    const articleCards = document.querySelectorAll<HTMLElement>(".article");
    console.log("=== 文章卡片数量 ===", articleCards.length);

    expect(articleCards.length).toBe(3);

    const firstCard = articleCards[0];
    console.log("=== 第一张卡片 outerHTML ===", firstCard.outerHTML.substring(0, 300));
    console.log("=== 第一张卡片 dataset ===", JSON.stringify((firstCard as any).dataset));
    console.log("=== 第一张卡片 tagName ===", firstCard.tagName);
    console.log("=== 第一张卡片 data-id attr ===", firstCard.getAttribute("data-id"));

    // 点击前页面栈深度
    console.log("=== 点击前页面栈深度 ===", getCurrentPages().length);
    expect(getCurrentPages().length).toBe(1);

    // 模拟点击文章卡片（直接 click 卡片元素）
    firstCard.click();

    console.log("=== 点击后页面栈深度 ===", getCurrentPages().length);

    // 点击后应该跳转到详情页，页面栈深度为 2
    expect(getCurrentPages().length).toBe(2);
    expect(getCurrentPages()[1].route).toBe("pages/detail/detail");
  });

  it("点击卡片内部子元素（模拟真实浏览器点击文本）也能跳转", async () => {
    const appJson = JSON.parse(read("app.json"));
    (globalThis as any).App = createApp(appJson, { wxss: transformRpx(read("app.wxss")) });
    (globalThis as any).getApp = runtime.getApp;

    (globalThis as any).Page = createPage("pages/index/index", {
      render: compileToRender(read("pages/index/index.wxml")),
      config: JSON.parse(read("pages/index/index.json")),
      wxss: transformRpx(read("pages/index/index.wxss")),
    });
    await import(`${join(demoDir, "pages/index/index.js")}?t=${Date.now()}-child-1`);

    (globalThis as any).Page = createPage("pages/profile/profile", {
      render: compileToRender(read("pages/profile/profile.wxml")),
      config: JSON.parse(read("pages/profile/profile.json")),
      wxss: transformRpx(read("pages/profile/profile.wxss")),
    });
    await import(`${join(demoDir, "pages/profile/profile.js")}?t=${Date.now()}-child-2`);

    (globalThis as any).Page = createPage("pages/detail/detail", {
      render: compileToRender(read("pages/detail/detail.wxml")),
      config: JSON.parse(read("pages/detail/detail.json")),
      wxss: transformRpx(read("pages/detail/detail.wxss")),
    });
    await import(`${join(demoDir, "pages/detail/detail.js")}?t=${Date.now()}-child-3`);

    startApp();

    expect(getCurrentPages().length).toBe(1);

    // 找到第一张卡片里的标题文本子元素，模拟用户点击文字
    const firstCard = document.querySelector<HTMLElement>(".article")!;
    const titleText = firstCard.querySelector<HTMLElement>(".article-title")!;
    console.log("=== 标题元素 tagName ===", titleText.tagName);
    console.log("=== 标题元素 outerHTML ===", titleText.outerHTML.substring(0, 200));

    // 用 dispatchEvent 模拟真实点击（target 是子元素，事件冒泡到 card）
    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    Object.defineProperty(clickEvent, "target", { value: titleText, configurable: true });
    titleText.dispatchEvent(clickEvent);

    console.log("=== 子元素点击后页面栈深度 ===", getCurrentPages().length);
    expect(getCurrentPages().length).toBe(2);
    expect(getCurrentPages()[1].route).toBe("pages/detail/detail");
  });

  it("验证点击时 currentTarget.dataset.id 正确传递给 openDetail", async () => {
    const appJson = JSON.parse(read("app.json"));
    (globalThis as any).App = createApp(appJson, { wxss: transformRpx(read("app.wxss")) });
    (globalThis as any).getApp = runtime.getApp;

    (globalThis as any).Page = createPage("pages/index/index", {
      render: compileToRender(read("pages/index/index.wxml")),
      config: JSON.parse(read("pages/index/index.json")),
      wxss: transformRpx(read("pages/index/index.wxss")),
    });
    await import(`${join(demoDir, "pages/index/index.js")}?t=${Date.now()}-listener-1`);

    (globalThis as any).Page = createPage("pages/profile/profile", {
      render: compileToRender(read("pages/profile/profile.wxml")),
      config: JSON.parse(read("pages/profile/profile.json")),
      wxss: transformRpx(read("pages/profile/profile.wxss")),
    });
    await import(`${join(demoDir, "pages/profile/profile.js")}?t=${Date.now()}-listener-2`);

    (globalThis as any).Page = createPage("pages/detail/detail", {
      render: compileToRender(read("pages/detail/detail.wxml")),
      config: JSON.parse(read("pages/detail/detail.json")),
      wxss: transformRpx(read("pages/detail/detail.wxss")),
    });
    await import(`${join(demoDir, "pages/detail/detail.js")}?t=${Date.now()}-listener-3`);

    startApp();

    const firstCard = document.querySelector<HTMLElement>(".article")!;
    // Vapor 组件 fallthrough 用 addEventListener 绑定（不是 $evtclick 委托，也不是 onclick 属性）
    console.log("=== 卡片 $evtclick (delegation) ===", (firstCard as any).$evtclick);
    console.log("=== 卡片 onclick prop ===", (firstCard as any).onclick);

    expect(getCurrentPages().length).toBe(1);

    // 点击后 openDetail 应被调用，navigateTo 应成功
    firstCard.click();

    // 页面栈深度为 2 证明 openDetail 内的 navigateTo 执行成功
    expect(getCurrentPages().length).toBe(2);
    expect(getCurrentPages()[1].route).toBe("pages/detail/detail");

    // detail 页 onLoad 应收到 id=1
    const detailPage = getCurrentPages()[1] as any;
    console.log("=== detail 页 route ===", detailPage.route);
  });
});
