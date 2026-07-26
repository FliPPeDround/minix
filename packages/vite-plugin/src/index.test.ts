import { describe, expect, test } from "vite-plus/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import minix, {
  VIRTUAL_ENTRY_ID,
  injectAppImports,
  injectPageImports,
  transformRpx,
  transformTagSelectors,
  transformWxss,
} from "./index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "..", "__fixtures__");
const mpRoot = join(fixturesDir, "miniprogram");

/** 构造插件实例并跑过 configResolved（加载 fixture 的 app.json） */
function setupPlugin() {
  const plugin = minix({ root: "miniprogram" }) as any;
  plugin.configResolved({ root: fixturesDir });
  return plugin;
}

describe("transformRpx", () => {
  test("rpx 转 vw（750rpx = 100vw，由 postcss-px-to-viewport-8-plugin 处理）", () => {
    expect(transformRpx(".a{width:750rpx}")).toBe(".a{width:100vw}");
    expect(transformRpx(".a{margin:-12rpx 0}")).toBe(".a{margin:-1.6vw 0}");
    expect(transformRpx(".a{font-size:29.5rpx}")).toBe(".a{font-size:3.93333vw}");
  });

  test("普通 px 与其他内容不受影响", () => {
    expect(transformRpx(".a{width:100px;color:red}")).toBe(".a{width:100px;color:red}");
  });
});

describe("transformTagSelectors", () => {
  test("type selector 加 minix- 前缀", () => {
    expect(transformTagSelectors("view{color:red}")).toBe("minix-view{color:red}");
    expect(transformTagSelectors("text{color:red}")).toBe("minix-text{color:red}");
  });

  test("带连字符的标签整体替换", () => {
    expect(transformTagSelectors("scroll-view{overflow:auto}")).toBe(
      "minix-scroll-view{overflow:auto}",
    );
    expect(transformTagSelectors("swiper-item{flex:1}")).toBe("minix-swiper-item{flex:1}");
  });

  test("后代 / 子代 / 兄弟组合符都正确替换", () => {
    expect(transformTagSelectors(".container view{text-align:center}")).toBe(
      ".container minix-view{text-align:center}",
    );
    expect(transformTagSelectors("view>text{}")).toBe("minix-view>minix-text{}");
    expect(transformTagSelectors("view+text{}")).toBe("minix-view+minix-text{}");
    expect(transformTagSelectors("view~text{}")).toBe("minix-view~minix-text{}");
  });

  test("逗号分组列表全部替换", () => {
    expect(transformTagSelectors("view,text,image{display:block}")).toBe(
      "minix-view,minix-text,minix-image{display:block}",
    );
  });

  test(":not() / :is() 等函数内的标签也替换", () => {
    expect(transformTagSelectors(":not(view){}")).toBe(":not(minix-view){}");
    expect(transformTagSelectors(":is(view,text){}")).toBe(":is(minix-view,minix-text){}");
  });

  test("标签带伪类 / 属性 / class 后缀仍替换", () => {
    expect(transformTagSelectors("view:hover{}")).toBe("minix-view:hover{}");
    expect(transformTagSelectors("view.active{}")).toBe("minix-view.active{}");
    expect(transformTagSelectors("view[type=x]{}")).toBe("minix-view[type=x]{}");
  });

  test("类名 / id / 属性值里的 view 不受影响", () => {
    expect(transformTagSelectors(".view{}")).toBe(".view{}");
    expect(transformTagSelectors("#view{}")).toBe("#view{}");
    expect(transformTagSelectors("[type=view]{}")).toBe("[type=view]{}");
    expect(transformTagSelectors('[data-x="view"]{}')).toBe('[data-x="view"]{}');
  });

  test("非标签名子串不动（view-text / viewx）", () => {
    expect(transformTagSelectors("view-text{}")).toBe("view-text{}");
    expect(transformTagSelectors("viewx{}")).toBe("viewx{}");
  });

  test("declarations 里的字符串值不动", () => {
    expect(transformTagSelectors('view{content:"view"}')).toBe('minix-view{content:"view"}');
  });

  test("@media / @keyframes 等嵌套规则内也替换", () => {
    expect(transformTagSelectors("@media(min-width:1px){view{color:red}}")).toBe(
      "@media(min-width:1px){minix-view{color:red}}",
    );
  });
});

describe("transformWxss", () => {
  test("同时做标签选择器替换与 rpx 转 vw", () => {
    expect(transformWxss("view{width:750rpx}")).toBe("minix-view{width:100vw}");
    expect(transformWxss(".container text{font-size:28rpx}")).toBe(
      ".container minix-text{font-size:3.73333vw}",
    );
  });
});

describe("injectAppImports", () => {
  test("解耦后注入 App / setAppConfig / applyStyle 与 app.json / app.wxss", () => {
    const out = injectAppImports("App({});", { hasWxss: true });
    expect(out).toContain(`import { App, setAppConfig } from "minix";`);
    expect(out).toContain(`import __minixAppConfig from "./app.json";`);
    expect(out).toContain(`import __minixAppWxss from "./app.wxss";`);
    expect(out).toContain(`import { applyStyle } from "minix";`);
    expect(out).toContain(`applyStyle("minix:app", __minixAppWxss);`);
    expect(out).toContain(`setAppConfig(__minixAppConfig);`);
    expect(out.endsWith("App({});")).toBe(true);
  });

  test("没有 app.wxss 时不注入 applyStyle", () => {
    const out = injectAppImports("App({});", { hasWxss: false });
    expect(out).toContain(`import { App, setAppConfig } from "minix";`);
    expect(out).toContain(`import __minixAppConfig from "./app.json";`);
    expect(out).not.toContain("applyStyle");
    expect(out).not.toContain("app.wxss");
    expect(out).toContain(`setAppConfig(__minixAppConfig);`);
    expect(out.endsWith("App({});")).toBe(true);
  });
});

describe("injectPageImports", () => {
  test("注入 createPage 工厂、render、json 与 wxss", () => {
    const out = injectPageImports("Page({});", {
      route: "pages/index/index",
      basename: "index",
      hasJson: true,
      hasWxss: true,
    });
    expect(out).toContain(`import { createPage as __minixCreatePage } from "minix";`);
    expect(out).toContain(`import { render as __minixRender } from "./index.wxml";`);
    expect(out).toContain(`import __minixPageConfig from "./index.json";`);
    expect(out).toContain(`import __minixPageWxss from "./index.wxss";`);
    expect(out).toContain(
      `const Page = __minixCreatePage("pages/index/index", { render: __minixRender, config: __minixPageConfig, wxss: __minixPageWxss });`,
    );
  });

  test("没有 json / wxss 时注入降级值", () => {
    const out = injectPageImports("Page({});", {
      route: "pages/detail/detail",
      basename: "detail",
      hasJson: false,
      hasWxss: false,
    });
    expect(out).not.toContain(".json");
    expect(out).not.toContain(".wxss");
    expect(out).toContain("config: {}, wxss: undefined");
  });
});

describe("vite-plugin-minix", () => {
  test("虚拟入口：导入 app.js、全部页面并 startApp", () => {
    const plugin = setupPlugin();
    const resolved = plugin.resolveId(VIRTUAL_ENTRY_ID);
    expect(resolved).toBeTruthy();

    const code = plugin.load(resolved);
    expect(code).toContain(`import "${join(mpRoot, "app.js").replace(fixturesDir, "")}`);
    expect(code).toContain("/miniprogram/app.js");
    expect(code).toContain("/miniprogram/pages/index/index.js");
    expect(code).toContain("/miniprogram/pages/detail/detail.js");
    expect(code).toContain(`import { startApp } from "minix";`);
    expect(code).toContain("startApp();");
  });

  test("transform .wxml：产出 render 模块并引用 minix", () => {
    const plugin = setupPlugin();
    const wxml = readFileSync(join(mpRoot, "pages/index/index.wxml"), "utf-8");
    const result = plugin.transform(wxml, join(mpRoot, "pages/index/index.wxml"));
    expect(result.code).toContain("export function render");
    expect(result.code).toContain("from 'vue'");
  });

  test("transform .wxss：导出转好 rpx 的 CSS 字符串", () => {
    const plugin = setupPlugin();
    const wxss = readFileSync(join(mpRoot, "pages/index/index.wxss"), "utf-8");
    const result = plugin.transform(wxss, join(mpRoot, "pages/index/index.wxss"));
    expect(result.code.startsWith("export default ")).toBe(true);
    // 750rpx → 100vw（postcss-px-to-viewport-8-plugin 预计算，无运行时 calc）
    expect(result.code).toContain("100vw");
    expect(result.code).not.toContain("rpx");
  });

  test("transform app.js：解耦后注入 App / setAppConfig / applyStyle 与 app.wxss", () => {
    const plugin = setupPlugin();
    const code = readFileSync(join(mpRoot, "app.js"), "utf-8");
    const result = plugin.transform(code, join(mpRoot, "app.js"));
    expect(result.code).toContain(`import { App, setAppConfig } from "minix";`);
    expect(result.code).toContain(`import __minixAppWxss from "./app.wxss";`);
    expect(result.code).toContain(`import { applyStyle } from "minix";`);
    expect(result.code).toContain(`applyStyle("minix:app", __minixAppWxss);`);
    expect(result.code).toContain(`setAppConfig(__minixAppConfig);`);
  });

  test("transform 页面 js：按文件存在情况注入；getApp 按需注入", () => {
    const plugin = setupPlugin();

    const indexCode = readFileSync(join(mpRoot, "pages/index/index.js"), "utf-8");
    const index = plugin.transform(indexCode, join(mpRoot, "pages/index/index.js"));
    expect(index.code).toContain(`__minixCreatePage("pages/index/index"`);
    expect(index.code).toContain(`from "./index.json";`);
    expect(index.code).toContain(`from "./index.wxss";`);
    expect(index.code).toContain("createPage as __minixCreatePage, getApp");

    const detailCode = readFileSync(join(mpRoot, "pages/detail/detail.js"), "utf-8");
    const detail = plugin.transform(detailCode, join(mpRoot, "pages/detail/detail.js"));
    expect(detail.code).toContain(`__minixCreatePage("pages/detail/detail"`);
    expect(detail.code).not.toContain(".json");
    expect(detail.code).not.toContain(".wxss");
    expect(detail.code).toContain(`import { createPage as __minixCreatePage } from "minix";`);
  });

  test("小程序目录之外的文件不处理", () => {
    const plugin = setupPlugin();
    expect(plugin.transform("Page({});", join(fixturesDir, "other/outside.js"))).toBeNull();
    expect(plugin.transform("<view/>", join(fixturesDir, "other/outside.wxml"))).toBeNull();
  });
});
