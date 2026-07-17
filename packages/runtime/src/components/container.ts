import { defineVaporComponent, renderEffect, on, type VaporComponent } from "@vue/runtime-vapor";
import { compileTemplate, defineSlotElementComponent, insertDefaultSlot } from "./_shared.ts";

/**
 * 容器类组件：scroll-view / swiper / swiper-item / picker / picker-view / rich / progress。
 * 根元素统一为 minix-* 自定义元素。复杂交互（scroll 事件、轮播、picker 弹窗）后续补。
 */

// ---------------------------------------------------------------------------
// scroll-view：可滚动容器

const t_scrollView = compileTemplate(
  `<minix-scroll-view style="display:block;overflow:auto"></minix-scroll-view>`,
);

export const MinixScrollView: VaporComponent = defineVaporComponent({
  name: "minix-scroll-view",
  props: {
    scrollX: { type: Boolean, default: false },
    scrollY: { type: Boolean, default: false },
    upperThreshold: { type: [Number, String], default: 50 },
    lowerThreshold: { type: [Number, String], default: 50 },
    scrollTop: { type: [Number, String], default: 0 },
    scrollLeft: { type: [Number, String], default: 0 },
    scrollIntoView: { type: String, default: "" },
    scrollWithAnimation: { type: Boolean, default: false },
  },
  setup(props, ctx) {
    const n0 = t_scrollView();
    renderEffect(() => {
      const el = n0 as HTMLElement;
      el.style.overflowX = props.scrollX ? "auto" : "hidden";
      el.style.overflowY = props.scrollY ? "auto" : "hidden";
    });
    let lastFire = 0;
    const fire = (type: "scroll" | "scrolltoupper" | "scrolltolower", detail: any) => {
      const now = Date.now();
      if (type === "scroll" && now - lastFire < 16) return;
      lastFire = now;
      (ctx as any).emit?.(type, { detail });
      const fn = (ctx.attrs as any)[`on${type[0].toUpperCase()}${type.slice(1)}`];
      if (typeof fn === "function") fn({ detail });
    };
    on(n0 as Element, "scroll", () => {
      const el = n0 as HTMLElement;
      const upper = Number(props.upperThreshold);
      const lower = Number(props.lowerThreshold);
      fire("scroll", {
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        scrollWidth: el.scrollWidth,
        deltaX: 0,
        deltaY: 0,
      });
      if (el.scrollTop <= upper) fire("scrolltoupper", { direction: "top" });
      if (el.scrollHeight - el.scrollTop - el.clientHeight <= lower)
        fire("scrolltolower", { direction: "bottom" });
    });
    insertDefaultSlot(n0);
    return n0;
  },
});

// ---------------------------------------------------------------------------
// swiper / swiper-item：第一版仅渲染容器，轮播逻辑后续补

const t_swiper = compileTemplate(
  `<minix-swiper style="display:flex;overflow:hidden;position:relative"></minix-swiper>`,
);

export const MinixSwiper: VaporComponent = defineVaporComponent({
  name: "minix-swiper",
  props: {
    current: { type: Number, default: 0 },
    autoplay: { type: Boolean, default: false },
    interval: { type: Number, default: 5000 },
    duration: { type: Number, default: 500 },
    circular: { type: Boolean, default: false },
    vertical: { type: Boolean, default: false },
  },
  setup(props) {
    const n0 = t_swiper();
    renderEffect(() => {
      (n0 as HTMLElement).style.flexDirection = props.vertical ? "column" : "row";
    });
    // TODO: 实现自动播放、切换动画、bindchange
    insertDefaultSlot(n0);
    return n0;
  },
});

export const MinixSwiperItem: VaporComponent = defineSlotElementComponent(
  "minix-swiper-item",
  "display:flex;flex:1 0 100%",
);

// ---------------------------------------------------------------------------
// picker / picker-view：第一版仅渲染触发容器，弹窗逻辑后续补

export const MinixPicker: VaporComponent = defineSlotElementComponent(
  "minix-picker",
  "display:block",
);
export const MinixPickerView: VaporComponent = defineSlotElementComponent(
  "minix-picker-view",
  "display:block",
);

// ---------------------------------------------------------------------------
// rich：富文本，nodes 支持 HTML 字符串

const t_rich = compileTemplate(`<minix-rich style="display:block"></minix-rich>`);

export const MinixRich: VaporComponent = defineVaporComponent({
  name: "minix-rich",
  props: {
    nodes: { type: [String, Array], default: "" },
  },
  setup(props) {
    const n0 = t_rich();
    renderEffect(() => {
      const html = typeof props.nodes === "string" ? props.nodes : "";
      (n0 as HTMLElement).innerHTML = html;
    });
    return n0;
  },
});

// ---------------------------------------------------------------------------
// progress：进度条

const t_progress = compileTemplate(
  `<minix-progress style="display:flex;align-items:center"><div style="flex:1;overflow:hidden"><div style="height:100%;transition:width .3s"></div></div><span style="margin-left:8px;font-size:12px"></span></minix-progress>`,
);

export const MinixProgress: VaporComponent = defineVaporComponent({
  name: "minix-progress",
  props: {
    percent: { type: [Number, String], default: 0 },
    showInfo: { type: Boolean, default: false },
    strokeWidth: { type: [Number, String], default: 6 },
    activeColor: { type: String, default: "#09BB07" },
    backgroundColor: { type: String, default: "#EBEBEB" },
  },
  setup(props) {
    const n0 = t_progress();
    const track = (n0 as HTMLElement).firstChild as HTMLElement;
    const bar = track.firstChild as HTMLElement;
    const label = (n0 as HTMLElement).lastChild as HTMLElement;
    renderEffect(() => {
      const pct = Math.max(0, Math.min(100, Number(props.percent) || 0));
      const widthPx =
        typeof props.strokeWidth === "number" ? `${props.strokeWidth}px` : props.strokeWidth;
      track.style.height = widthPx;
      track.style.background = props.backgroundColor;
      track.style.borderRadius = widthPx;
      bar.style.width = `${pct}%`;
      bar.style.height = "100%";
      bar.style.background = props.activeColor;
      label.textContent = props.showInfo ? `${pct}%` : "";
      label.style.display = props.showInfo ? "" : "none";
    });
    return n0;
  },
});
