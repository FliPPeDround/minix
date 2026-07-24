import { defineVaporComponent, on, renderEffect, setProp, template } from "@vue/runtime-vapor";
import { pushStyle } from "../../style.ts";
import webViewCss from "./web-view.css?inline";

pushStyle("minix:components", webViewCss);

/**
 * web-view：minix-web-view 外壳包原生 <iframe>。
 *
 * 小程序语义：<web-view> 加载并展示外部网页，覆盖整个页面。浏览器侧
 * 直接用 iframe 实现，受同源策略限制（无法访问跨域 iframe 内 DOM）。
 *
 * 事件：bindmessage（web-view 内页面通过 wx.miniProgram.postMessage 触发，
 * 浏览器侧通过 postMessage 监听，message 格式由用户业务自行约定）、
 * bindload（iframe onload）。
 */
export default function WebView() {
  const t = template(
    `<minix-web-view><iframe style="width:100%;height:100%;border:0"></iframe></minix-web-view>`,
  );
  return defineVaporComponent({
    name: "minix-web-view",
    props: {
      src: { type: String, default: "" },
    },
    setup(props, ctx) {
      const n0 = t() as HTMLElement;
      const iframe = n0.firstChild as HTMLIFrameElement;

      renderEffect(() => {
        setProp(iframe, "src", props.src);
      });

      on(iframe, "load", () => {
        ctx.emit?.("load", { detail: { src: props.src } });
        const fn = (ctx.attrs as any).onLoad;
        if (typeof fn === "function") fn({ detail: { src: props.src } });
      });

      // window 不是 Element，vapor 的 on(...) 类型不接受；用原生 addEventListener。
      const onMessage = (e: MessageEvent) => {
        if (e.source !== iframe.contentWindow) return;
        ctx.emit?.("message", { detail: { data: e.data } });
        const fn = (ctx.attrs as any).onMessage;
        if (typeof fn === "function") fn({ detail: { data: e.data } });
      };
      window.addEventListener("message", onMessage);

      return n0;
    },
  });
}
