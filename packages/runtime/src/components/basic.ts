import {
  defineVaporComponent,
  renderEffect,
  setProp,
  on,
  type VaporComponent,
} from "@vue/runtime-vapor";
import { compileTemplate, defineSlotElementComponent, insertDefaultSlot } from "./_shared.ts";
import { navigateTo, navigateBack, redirectTo, reLaunch, switchTab } from "../router.ts";

/**
 * 基础内容组件：view / text / icon / image / navigator。
 * 根元素统一为 minix-* 自定义元素，避免与浏览器原生标签样式冲突。
 */

// ---------------------------------------------------------------------------
// view：等价小程序 view，块级容器

export const MinixView: VaporComponent = defineSlotElementComponent("minix-view", "display:block");

// ---------------------------------------------------------------------------
// text：等价小程序 text，inline 文本容器

export const MinixText: VaporComponent = defineSlotElementComponent("minix-text", "display:inline");

// ---------------------------------------------------------------------------
// icon：小程序内置图标，用内联 SVG 渲染

const ICON_PATHS: Record<string, string> = {
  success: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  success_no_circle:
    "M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM12 19A7 7 0 1 0 5 12a7 7 0 0 0 7 7zm-1.06-4.94l5.5-5.5L15 7l-4.06 4.06L9.5 9.62 8.06 11z",
  info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
  warn: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
  waiting:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z",
  cancel:
    "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z",
  download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
  search:
    "M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z",
  clear:
    "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
};

const t_icon = compileTemplate(
  `<minix-icon style="display:inline-block;line-height:0"><svg viewBox="0 0 24 24" fill="currentColor" style="display:block"><path d=""></path></svg></minix-icon>`,
);

export const MinixIcon: VaporComponent = defineVaporComponent({
  name: "minix-icon",
  props: {
    type: { type: String, required: true },
    size: { type: [Number, String], default: 23 },
    color: { type: String, default: "inherit" },
  },
  setup(props) {
    const n0 = t_icon();
    const svg = n0.firstChild as SVGElement;
    const path = svg.firstChild as SVGPathElement;
    const sizePx = () => (typeof props.size === "number" ? `${props.size}px` : props.size);
    renderEffect(() => {
      path.setAttribute("d", ICON_PATHS[props.type as string] ?? "");
      svg.setAttribute("width", sizePx());
      svg.setAttribute("height", sizePx());
      svg.style.color = props.color;
    });
    return n0;
  },
});

// ---------------------------------------------------------------------------
// image：minix-image 外壳包 <img>，mode 缩放语义作用于内部 img

const IMAGE_MODE_FIT: Record<string, string> = {
  scaleToFill: "fill",
  aspectFit: "contain",
  aspectFill: "cover",
  top: "none",
  bottom: "none",
  center: "none",
  left: "none",
  right: "none",
  "top left": "none",
  "top right": "none",
  "bottom left": "none",
  "bottom right": "none",
};

const IMAGE_MODE_POSITION: Record<string, string> = {
  top: "center top",
  bottom: "center bottom",
  center: "center center",
  left: "left center",
  right: "right center",
  "top left": "left top",
  "top right": "right top",
  "bottom left": "left bottom",
  "bottom right": "right bottom",
};

const t_img = compileTemplate(
  `<minix-image style="display:inline-block"><img style="display:block;width:100%;height:100%" /></minix-image>`,
);

export const MinixImage: VaporComponent = defineVaporComponent({
  name: "minix-image",
  props: {
    src: { type: String, default: "" },
    mode: { type: String, default: "scaleToFill" },
    lazyLoad: { type: Boolean, default: false },
  },
  setup(props) {
    const n0 = t_img();
    const img = n0.firstChild as HTMLImageElement;
    renderEffect(() => {
      setProp(img, "src", props.src);
      setProp(img, "loading", props.lazyLoad ? "lazy" : "eager");
      img.style.objectFit = IMAGE_MODE_FIT[props.mode] ?? "fill";
      img.style.objectPosition = IMAGE_MODE_POSITION[props.mode] ?? "50% 50%";
      if (props.mode === "widthFix") {
        img.style.height = "auto";
        img.style.width = "100%";
      }
    });
    return n0;
  },
});

// ---------------------------------------------------------------------------
// navigator：minix-navigator 外壳，点击走小程序路由 API（不用 a 的导航）

const t_a = compileTemplate(`<minix-navigator style="display:inline"></minix-navigator>`);

export const MinixNavigator: VaporComponent = defineVaporComponent({
  name: "minix-navigator",
  props: {
    url: { type: String, default: "" },
    openType: { type: String as () => NavigatorOpenType, default: "navigate" },
    target: { type: String, default: "self" },
    delta: { type: Number, default: 1 },
  },
  setup(props) {
    const n0 = t_a();
    on(n0 as Element, "click", (e: Event) => {
      if (props.target !== "self" || props.openType === "exit") return;
      e.preventDefault();
      if (props.openType === "navigateBack") {
        navigateBack({ delta: props.delta });
        return;
      }
      if (!props.url) return;
      switch (props.openType) {
        case "navigate":
          navigateTo({ url: props.url });
          break;
        case "redirect":
          redirectTo({ url: props.url });
          break;
        case "switchTab":
          switchTab({ url: props.url });
          break;
        case "reLaunch":
          reLaunch({ url: props.url });
          break;
      }
    });
    insertDefaultSlot(n0);
    return n0;
  },
});

type NavigatorOpenType =
  | "navigate"
  | "redirect"
  | "switchTab"
  | "reLaunch"
  | "navigateBack"
  | "exit";
