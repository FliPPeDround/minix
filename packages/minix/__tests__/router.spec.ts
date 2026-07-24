import { describe, it, expect, beforeEach } from "vite-plus/test";
import {
  createApp,
  createPage,
  startApp,
  getApp,
  getCurrentPages,
  navigateTo,
  navigateBack,
  redirectTo,
  reLaunch,
  switchTab,
  __resetMinixRuntime,
  template,
  txt,
  setText,
  renderEffect,
  toDisplayString,
} from "../src/index.ts";

/** 模拟 compiler 产物的 render：把 _ctx[key] 渲染到 .root 的文本里 */
function makeRender(key: string) {
  const t0 = template('<div class="root"> </div>');
  return function render(_ctx: any) {
    const n0 = t0() as HTMLElement;
    const x0 = txt(n0) as any;
    renderEffect(() => setText(x0, toDisplayString(_ctx[key])));
    return n0;
  };
}

const pageEl = () => document.querySelector<HTMLElement>(".minix-page")!;
const pageEls = () => [...document.querySelectorAll<HTMLElement>(".minix-page")];
/** 当前可见的页面（隐藏的页面保留在 DOM 中） */
const visiblePageEl = () => pageEls().find((el) => el.style.display !== "none")!;
const navTitle = () => document.querySelector(".minix-navbar-title")!;
const styleOf = (id: string) => document.querySelector(`style[data-minix-style="${id}"]`);

beforeEach(() => {
  __resetMinixRuntime();
  document.body.innerHTML = "";
});

describe("createApp / createPage / startApp", () => {
  it("启动后挂载入口页，导航栏标题来自 app.json window", () => {
    let launched = false;
    createApp({
      pages: ["pages/index/index"],
      window: {
        navigationBarTitleText: "demo 应用",
        navigationBarBackgroundColor: "#07c160",
        navigationBarTextStyle: "white",
      },
    })({
      onLaunch() {
        launched = true;
      },
    });
    createPage("pages/index/index", { render: makeRender("msg") })({
      data: { msg: "home" },
    });

    startApp();

    expect(pageEl().querySelector(".root")!.textContent).toBe("home");
    expect(navTitle().textContent).toBe("demo 应用");
    expect(launched).toBe(true);
    expect(getCurrentPages().length).toBe(1);
    expect(getCurrentPages()[0].route).toBe("pages/index/index");
  });

  it("页面 json 的 navigationBarTitleText 覆盖 window 配置", () => {
    createApp({
      pages: ["pages/index/index"],
      window: { navigationBarTitleText: "全局标题" },
    })({});
    createPage("pages/index/index", {
      render: makeRender("msg"),
      config: { navigationBarTitleText: "首页" },
    })({ data: { msg: "x" } });

    startApp();

    expect(navTitle().textContent).toBe("首页");
  });

  it("getApp() 可访问 globalData", () => {
    createApp({ pages: ["pages/index/index"] })({
      globalData: { user: "minix-user" },
    });
    let seen = "";
    createPage("pages/index/index", { render: makeRender("msg") })({
      data: { msg: "x" },
      onLoad() {
        seen = getApp().globalData.user;
      },
    });

    startApp();

    expect(seen).toBe("minix-user");
  });
});

describe("navigateTo / navigateBack", () => {
  function setup() {
    const events: string[] = [];
    createApp({ pages: ["pages/a/a", "pages/b/b"] })({});
    createPage("pages/a/a", { render: makeRender("x") })({
      data: { x: "A" },
      onShow() {
        events.push("a:show");
      },
      onHide() {
        events.push("a:hide");
      },
    });
    createPage("pages/b/b", { render: makeRender("x") })({
      data: { x: "B" },
      onLoad(query: Record<string, string>) {
        events.push(`b:load:${query.id}`);
      },
      onUnload() {
        events.push("b:unload");
      },
    });
    startApp();
    return events;
  }

  it("跳转新页面：onLoad 收到 query，原页面 onHide 且隐藏", () => {
    const events = setup();

    navigateTo({ url: "/pages/b/b?id=42" });

    expect(getCurrentPages().length).toBe(2);
    expect(events).toContain("b:load:42");
    expect(events).toContain("a:hide");
    const [a, b] = pageEls();
    expect(a.style.display).toBe("none");
    expect(b.style.display).toBe("");
    expect(b.querySelector(".root")!.textContent).toBe("B");
  });

  it("navigateBack 卸载当前页并恢复原页面", () => {
    const events = setup();
    navigateTo({ url: "/pages/b/b?id=42" });
    events.length = 0;

    navigateBack();

    expect(events).toContain("b:unload");
    expect(events).toContain("a:show");
    expect(getCurrentPages().length).toBe(1);
    expect(pageEls().length).toBe(1);
    expect(pageEl().querySelector(".root")!.textContent).toBe("A");
  });

  it("navigateTo 到 tabBar 页面会 fail", () => {
    createApp({
      pages: ["pages/index/index"],
      tabBar: { list: [{ pagePath: "pages/index/index", text: "首页" }] },
    })({});
    createPage("pages/index/index", { render: makeRender("x") })({ data: { x: "A" } });
    startApp();

    let err: any;
    navigateTo({ url: "/pages/index/index", fail: (e) => (err = e) });

    expect(err).toBeTruthy();
    expect(getCurrentPages().length).toBe(1);
  });
});

describe("redirectTo / reLaunch", () => {
  it("redirectTo 替换当前页", () => {
    const events: string[] = [];
    createApp({ pages: ["pages/a/a", "pages/b/b"] })({});
    createPage("pages/a/a", { render: makeRender("x") })({
      data: { x: "A" },
      onUnload() {
        events.push("a:unload");
      },
    });
    createPage("pages/b/b", { render: makeRender("x") })({ data: { x: "B" } });
    startApp();

    redirectTo({ url: "/pages/b/b" });

    expect(events).toContain("a:unload");
    expect(getCurrentPages().length).toBe(1);
    expect(pageEl().querySelector(".root")!.textContent).toBe("B");
  });

  it("reLaunch 清空页面栈并卸载页面样式", () => {
    createApp({ pages: ["pages/a/a", "pages/b/b"] })({});
    createPage("pages/a/a", { render: makeRender("x"), wxss: ".a{color:red}" })({
      data: { x: "A" },
    });
    createPage("pages/b/b", { render: makeRender("x") })({ data: { x: "B" } });
    startApp();

    expect(styleOf("minix:page:pages/a/a")).toBeTruthy();

    reLaunch({ url: "/pages/b/b" });

    expect(getCurrentPages().length).toBe(1);
    expect(pageEl().querySelector(".root")!.textContent).toBe("B");
    expect(styleOf("minix:page:pages/a/a")).toBeNull();
  });
});

describe("tabBar / switchTab", () => {
  function setupTabs() {
    const counts = { indexLoads: 0, profileLoads: 0 };
    createApp({
      pages: ["pages/index/index", "pages/profile/profile", "pages/detail/detail"],
      tabBar: {
        color: "#999999",
        selectedColor: "#07c160",
        list: [
          { pagePath: "pages/index/index", text: "首页" },
          { pagePath: "pages/profile/profile", text: "我的" },
        ],
      },
    })({});
    createPage("pages/index/index", { render: makeRender("x") })({
      data: { x: "首页内容" },
      onLoad() {
        counts.indexLoads++;
      },
    });
    createPage("pages/profile/profile", { render: makeRender("x") })({
      data: { x: "我的内容" },
      onLoad() {
        counts.profileLoads++;
      },
    });
    createPage("pages/detail/detail", { render: makeRender("x") })({
      data: { x: "详情内容" },
    });
    startApp();
    return counts;
  }

  it("启动时渲染 tabBar，入口为 tab 页", () => {
    setupTabs();
    const items = document.querySelectorAll(".minix-tabbar-item");
    expect(items.length).toBe(2);
    expect(items[0].textContent).toBe("首页");
    expect(items[1].textContent).toBe("我的");
    expect(pageEl().querySelector(".root")!.textContent).toBe("首页内容");
  });

  it("switchTab 切换页面，tab 页缓存不重复 onLoad", () => {
    const counts = setupTabs();

    switchTab({ url: "/pages/profile/profile" });
    expect(visiblePageEl().querySelector(".root")!.textContent).toBe("我的内容");
    expect(counts.profileLoads).toBe(1);

    switchTab({ url: "/pages/index/index" });
    expect(visiblePageEl().querySelector(".root")!.textContent).toBe("首页内容");
    expect(counts.indexLoads).toBe(1);

    switchTab({ url: "/pages/profile/profile" });
    expect(counts.profileLoads).toBe(1);
  });

  it("tab 页上 navigateTo 普通页，返回后恢复原 tab", () => {
    setupTabs();

    navigateTo({ url: "/pages/detail/detail" });
    expect(getCurrentPages().length).toBe(2);
    expect(pageEls()[1].querySelector(".root")!.textContent).toBe("详情内容");

    navigateBack();
    expect(pageEl().querySelector(".root")!.textContent).toBe("首页内容");
    expect(document.querySelectorAll(".minix-tabbar-item").length).toBe(2);
  });

  it("switchTab 到非 tab 页会 fail", () => {
    setupTabs();
    let err: any;
    switchTab({ url: "/pages/detail/detail", fail: (e) => (err = e) });
    expect(err).toBeTruthy();
  });
});

describe("wxss 注入", () => {
  it("app wxss 全局注入", () => {
    createApp({ pages: ["pages/a/a"] }, { wxss: ".global{color:green}" })({});
    createPage("pages/a/a", { render: makeRender("x") })({ data: { x: "A" } });

    startApp();

    const el = styleOf("minix:app");
    expect(el).toBeTruthy();
    expect(el!.textContent).toContain(".global{color:green}");
  });
});
