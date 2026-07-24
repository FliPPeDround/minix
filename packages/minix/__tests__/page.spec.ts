import { describe, it, expect, beforeEach, afterEach } from "vite-plus/test";
import { nextTick } from "@vue/runtime-dom";
import {
  Page,
  getCurrentPages,
  template,
  txt,
  toDisplayString,
  setText,
  setElementText,
  renderEffect,
  delegate,
  delegateEvents,
} from "../src/index.ts";

describe("Page API", () => {
  beforeEach(() => {
    delegateEvents("click");
  });

  afterEach(() => {
    document.body.querySelectorAll(".minix-page").forEach((el) => el.remove());
  });

  it("should render initial data", () => {
    const t0 = template('<div class="msg"></div>');

    Page({
      data: { msg: "hello minix" },
      render() {
        const root = t0() as HTMLElement;
        renderEffect(() => setElementText(root, this.data.msg));
        return root;
      },
    });

    const msgEl = document.body.querySelector(".minix-page .msg")!;
    expect(msgEl.textContent).toBe("hello minix");
  });

  it("should update DOM when setData is called", async () => {
    const t0 = template('<div class="msg"></div>');

    let pageInstance: any;
    Page({
      data: { msg: "before" },
      render() {
        pageInstance = this;
        const root = t0() as HTMLElement;
        renderEffect(() => setElementText(root, this.data.msg));
        return root;
      },
    });

    const msgEl = document.body.querySelector(".minix-page .msg")!;
    expect(msgEl.textContent).toBe("before");

    pageInstance.setData({ msg: "after" });
    await nextTick();
    expect(msgEl.textContent).toBe("after");
  });

  it("should bind event handlers with correct this context", () => {
    const t0 = template('<button class="btn">click</button>');

    let pageInstance: any;
    Page({
      data: { count: 0 },
      handleClick() {
        pageInstance = this;
        this.setData({ count: this.data.count + 1 });
      },
      render() {
        const root = t0() as HTMLElement;
        delegate(root, "click", () => this.handleClick());
        return root;
      },
    });

    const btn = document.body.querySelector(".minix-page .btn") as HTMLElement;
    btn.click();

    expect(pageInstance).toBeDefined();
    expect(pageInstance.data.count).toBe(1);
  });

  it("should support multiple setData calls", async () => {
    const t0 = template('<div class="wrap"><div class="a"></div><div class="b"></div></div>');

    let pageInstance: any;
    Page({
      data: { a: "A0", b: "B0" },
      render() {
        pageInstance = this;
        const root = t0() as HTMLElement;
        const elA = root.querySelector(".a")!;
        const elB = root.querySelector(".b")!;
        renderEffect(() => setElementText(elA, this.data.a));
        renderEffect(() => setElementText(elB, this.data.b));
        return root;
      },
    });

    const page = document.body.querySelector(".minix-page")!;
    expect(page.querySelector(".a")!.textContent).toBe("A0");
    expect(page.querySelector(".b")!.textContent).toBe("B0");

    pageInstance.setData({ a: "A1" });
    await nextTick();
    expect(page.querySelector(".a")!.textContent).toBe("A1");
    expect(page.querySelector(".b")!.textContent).toBe("B0");

    pageInstance.setData({ b: "B1" });
    await nextTick();
    expect(page.querySelector(".a")!.textContent).toBe("A1");
    expect(page.querySelector(".b")!.textContent).toBe("B1");
  });

  it("should register page in getCurrentPages", () => {
    Page({
      data: { x: 1 },
      render() {
        return document.createElement("div");
      },
    });

    const pages = getCurrentPages();
    expect(pages.length).toBeGreaterThan(0);
    expect(pages[pages.length - 1].data.x).toBe(1);
  });

  it("should call onLoad lifecycle", () => {
    let loaded = false;
    Page({
      data: {},
      onLoad() {
        loaded = true;
      },
      render() {
        return document.createElement("div");
      },
    });

    expect(loaded).toBe(true);
  });
});

// 模拟 compiler 生成代码与 runtime 的结合：
//   1. 模块级 template 缓存（_template）
//   2. render(_ctx, ...) 通过 _ctx.msg 访问 data、_ctx.onTap 调方法
//   3. 使用 toDisplayString / setText / renderEffect 等 helper
describe("compiler codegen integration", () => {
  beforeEach(() => {
    delegateEvents("click");
  });

  afterEach(() => {
    document.body.querySelectorAll(".minix-page").forEach((el) => el.remove());
  });

  it("should render _ctx.msg via toDisplayString (compiler output shape)", async () => {
    // === 模拟 compiler 输出 start ===
    const t0 = template('<div class="msg"> </div>');
    function compiledRender(_ctx: any) {
      const n0 = t0() as HTMLElement;
      // compiler 产出的是无类型 JS，txt() 返回的实际上是 Text 节点
      const x0 = txt(n0) as any;
      renderEffect(() => setText(x0, toDisplayString(_ctx.msg)));
      return n0;
    }
    // === 模拟 compiler 输出 end ===

    Page({
      data: { msg: "hello minix" },
      render: compiledRender,
    });

    // compiler 风格 render 中 _ctx.msg 直接访问 data，无需 this.data
    const msgEl = document.body.querySelector(".minix-page .msg")!;
    expect(msgEl.textContent).toBe("hello minix");
  });

  it("should update when setData reassigns a field accessed via _ctx", async () => {
    const t0 = template('<div class="msg"> </div>');
    function compiledRender(_ctx: any) {
      const n0 = t0() as HTMLElement;
      const x0 = txt(n0) as any;
      renderEffect(() => setText(x0, toDisplayString(_ctx.msg)));
      return n0;
    }

    let pageInstance: any;
    Page({
      data: { msg: "before" },
      render(ctx: any) {
        // 混合风格：仍可用 this 拿到 instance
        pageInstance = this;
        return compiledRender(ctx);
      },
    });

    const msgEl = document.body.querySelector(".minix-page .msg")!;
    expect(msgEl.textContent).toBe("before");

    pageInstance.setData({ msg: "after" });
    await nextTick();
    expect(msgEl.textContent).toBe("after");
  });

  it("should resolve event handler via _ctx.onTap (bound to instance)", () => {
    const t0 = template('<button class="btn">click</button>');
    function compiledRender(_ctx: any) {
      const n0 = t0() as HTMLElement;
      delegate(n0, "click", (e: Event) => _ctx.onTap(e));
      return n0;
    }

    let tappedInstance: any;
    Page({
      data: { count: 0 },
      onTap() {
        tappedInstance = this;
        this.setData({ count: this.data.count + 1 });
      },
      render: compiledRender,
    });

    const btn = document.body.querySelector(".minix-page .btn") as HTMLElement;
    btn.click();

    // _ctx.onTap 解析到 instance.onTap，且 this 绑定正确
    expect(tappedInstance).toBeDefined();
    expect(tappedInstance.data.count).toBe(1);
  });
});
