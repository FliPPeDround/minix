import { defineVaporComponent, on, renderEffect, setProp, template } from "@vue/runtime-vapor";
import { pushStyle } from "../../style.ts";
import canvasCss from "./canvas.css?inline";
import { canvasProps } from "./props.ts";

pushStyle("minix:components", canvasCss);

/**
 * canvas：minix-canvas 外壳包原生 <canvas>。
 *
 * 小程序语义：
 * - type="2d"：新版 Canvas 2D API，等价 HTML5 Canvas 2D Context
 * - type="webgl"：WebGL 渲染
 * - canvasId：旧版 API 标识符，配合 wx.createCanvasContext(id) 使用
 *
 * 实现方式：把 canvasId / type 同步到内部 <canvas>，并在挂载时把内部
 * <canvas> 注册到全局 canvasRegistry（按 canvasId），方便旧版 API 通过
 * wx.createCanvasContext(id) 拿到 Canvas 2D context。新版 type="2d"
 * 直接走 SelectorQuery.node() 拿 <canvas> 元素，与浏览器原生用法一致。
 */
const canvasRegistry = new Map<string, HTMLCanvasElement>();
/**
 * 取出已注册的 canvas 元素，供旧版 createCanvasContext API 使用。
 * 由 runtime/app.ts 在注入 wx.createCanvasContext 时调用。
 */
export function getCanvasById(id: string): HTMLCanvasElement | undefined {
  return canvasRegistry.get(id);
}

export default function Canvas() {
  const t = template(
    `<minix-canvas><canvas style="width:100%;height:100%;display:block"></canvas></minix-canvas>`,
  );
  return defineVaporComponent({
    name: "minix-canvas",
    props: canvasProps,
    setup(props, ctx) {
      const n0 = t() as HTMLElement;
      const canvas = n0.firstChild as HTMLCanvasElement;

      renderEffect(() => {
        if (props.canvasId) {
          setProp(canvas, "id", props.canvasId);
          canvasRegistry.set(props.canvasId, canvas);
        }
        // type=2d/webgl 只是提示，实际 context 由用户代码 .getContext() 创建
        if (props.type) setProp(canvas, "data-type", props.type);
      });

      // 触摸事件不冒泡到外层 page（disableScroll=true 时阻止滚动）
      on(canvas, "touchstart", (e: Event) => {
        if (props.disableScroll) e.preventDefault();
        ctx.emit?.("touchstart", { touches: (e as TouchEvent).touches });
        const fn = (ctx.attrs as any).onTouchstart;
        if (typeof fn === "function") fn({ touches: (e as TouchEvent).touches });
      });
      on(canvas, "touchmove", (e: Event) => {
        if (props.disableScroll) e.preventDefault();
        ctx.emit?.("touchmove", { touches: (e as TouchEvent).touches });
        const fn = (ctx.attrs as any).onTouchmove;
        if (typeof fn === "function") fn({ touches: (e as TouchEvent).touches });
      });

      return n0;
    },
  });
}
