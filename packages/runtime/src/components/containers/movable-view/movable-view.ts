import {
  createSlot,
  defineVaporComponent,
  on,
  renderEffect,
  setInsertionState,
  template,
} from "@vue/runtime-vapor";
import { pushStyle } from "../../../style.ts";
import movableViewCss from "./movable-view.css?inline";
import { movableViewProps } from "./props.ts";

pushStyle("minix:components", movableViewCss);

type Point = { x: number; y: number };
type TouchState = {
  startPointer: Point;
  startOffset: Point;
  startScale: number;
  startDistance: number;
  scale: number;
  velocity: Point;
  lastTime: number;
  lastOffset: Point;
  rafId: number;
};

/**
 * movable-view：minix-movable-view 自定义元素，可在父级 movable-area 内拖拽。
 *
 * 小程序语义：
 * - direction 控制可拖拽方向（all/vertical/horizontal/none）
 * - x/y 是受控位置，setData 改 x/y 会平移到新位置
 * - inertia=true 释放后保留惯性，damping 控制阻尼
 * - out-of-bounds=true 允许拖出父级边界（松手回弹）
 * - scale=true 支持双指缩放，scaleMin/Max 限制缩放范围
 * - bindchange 在拖拽过程中持续触发，detail.x/y 为当前位置
 *
 * 实现方式：使用 pointer events 统一鼠标/触摸；双指缩放时监听
 * pointerdown/update/up，并跟踪两指距离换算缩放系数。父子关系通过
 * DOM closest() 查找最近的 minix-movable-area 祖先，无需显式注入。
 */
export default function MovableView() {
  const t = template(`<minix-movable-view>`);
  return defineVaporComponent({
    name: "minix-movable-view",
    props: movableViewProps,
    setup(props, ctx) {
      const view = t() as HTMLElement;
      // 当前累计 offset 与 scale（脱离响应式以避免每帧触发 renderEffect）
      const state: TouchState = {
        startPointer: { x: 0, y: 0 },
        startOffset: { x: 0, y: 0 },
        startScale: 1,
        startDistance: 0,
        scale: 1,
        velocity: { x: 0, y: 0 },
        lastTime: 0,
        lastOffset: { x: 0, y: 0 },
        rafId: 0,
      };
      const activePointers = new Map<number, Point>();

      const clampOffset = (x: number, y: number): Point => {
        const parent = view.parentElement;
        if (!parent) return { x, y };
        const pr = parent.getBoundingClientRect();
        const r = view.getBoundingClientRect();
        // 缩放后的子节点尺寸
        const w = r.width;
        const h = r.height;
        let minX = props.outOfBounds ? -w : 0;
        let maxX = props.outOfBounds ? pr.width : pr.width - w;
        let minY = props.outOfBounds ? -h : 0;
        let maxY = props.outOfBounds ? pr.height : pr.height - h;
        if (maxX < minX) [minX, maxX] = [maxX, minX];
        if (maxY < minY) [minY, maxY] = [maxY, minY];
        return {
          x: Math.min(maxX, Math.max(minX, x)),
          y: Math.min(maxY, Math.max(minY, y)),
        };
      };

      const apply = (offset: Point, scale: number) => {
        view.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`;
      };

      const fire = (source: string) => {
        const detail = {
          x: state.lastOffset.x,
          y: state.lastOffset.y,
          source,
          scale: state.scale,
        };
        ctx.emit?.("change", { detail });
        const fn = (ctx.attrs as any).onChange;
        if (typeof fn === "function") fn({ detail });
      };

      const setOffset = (x: number, y: number, clamp = true) => {
        const next = clamp ? clampOffset(x, y) : { x, y };
        state.lastOffset = next;
        apply(next, state.scale);
        fire("touch");
      };

      // 受控 x/y：props.x/y 变化时直接平移到新位置
      renderEffect(() => {
        const x = Number(props.x) || 0;
        const y = Number(props.y) || 0;
        state.lastOffset = clampOffset(x, y);
        apply(state.lastOffset, state.scale);
      });

      // 受控 scaleValue
      renderEffect(() => {
        if (!props.scale) return;
        const s = Math.max(
          Number(props.scaleMin) || 0,
          Math.min(Number(props.scaleMax) || 10, Number(props.scaleValue) || 1),
        );
        state.scale = s;
        apply(state.lastOffset, s);
      });

      const pointers = () => Array.from(activePointers.values());

      const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

      const inertiaLoop = () => {
        const damp = Number(props.damping) || 20;
        const friction = Math.max(0.001, Number(props.friction) || 2) / 10;
        state.velocity.x *= 1 - friction;
        state.velocity.y *= 1 - friction;
        if (Math.abs(state.velocity.x) < 0.05 && Math.abs(state.velocity.y) < 0.05) {
          state.rafId = 0;
          return;
        }
        state.lastOffset = clampOffset(
          state.lastOffset.x + state.velocity.x / damp,
          state.lastOffset.y + state.velocity.y / damp,
        );
        apply(state.lastOffset, state.scale);
        fire("friction");
        state.rafId = requestAnimationFrame(inertiaLoop);
      };

      on(view, "pointerdown", (e: PointerEvent) => {
        if (props.disabled) return;
        if (state.rafId) {
          cancelAnimationFrame(state.rafId);
          state.rafId = 0;
        }
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activePointers.size === 1) {
          state.startPointer = { x: e.clientX, y: e.clientY };
          state.startOffset = { ...state.lastOffset };
          state.velocity = { x: 0, y: 0 };
          state.lastTime = Date.now();
        } else if (activePointers.size === 2 && props.scale) {
          const [a, b] = pointers();
          state.startDistance = distance(a, b);
          state.startScale = state.scale;
        }
        try {
          view.setPointerCapture(e.pointerId);
        } catch {
          /* setPointerCapture 可能在某些 webview 抛错，忽略 */
        }
      });

      on(view, "pointermove", (e: PointerEvent) => {
        if (!activePointers.has(e.pointerId)) return;
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (activePointers.size === 2 && props.scale && state.startDistance > 0) {
          const [a, b] = pointers();
          const dist = distance(a, b);
          const ratio = dist / state.startDistance;
          const next = Math.max(
            Number(props.scaleMin) || 0,
            Math.min(Number(props.scaleMax) || 10, state.startScale * ratio),
          );
          state.scale = next;
          apply(state.lastOffset, next);
          const detail = { x: state.lastOffset.x, y: state.lastOffset.y, scale: next };
          ctx.emit?.("scale", { detail });
          const fn = (ctx.attrs as any).onScale;
          if (typeof fn === "function") fn({ detail });
          return;
        }

        if (activePointers.size !== 1) return;
        const dx = e.clientX - state.startPointer.x;
        const dy = e.clientY - state.startPointer.y;
        let nx = state.startOffset.x;
        let ny = state.startOffset.y;
        if (props.direction === "all" || props.direction === "horizontal") nx += dx;
        if (props.direction === "all" || props.direction === "vertical") ny += dy;
        const now = Date.now();
        const dt = Math.max(1, now - state.lastTime);
        state.velocity = {
          x: (nx - state.lastOffset.x) * (1000 / dt),
          y: (ny - state.lastOffset.y) * (1000 / dt),
        };
        state.lastTime = now;
        setOffset(nx, ny);
      });

      const endPointer = (e: PointerEvent) => {
        if (!activePointers.has(e.pointerId)) return;
        activePointers.delete(e.pointerId);
        try {
          view.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        if (activePointers.size === 0 && props.inertia) {
          state.rafId = requestAnimationFrame(inertiaLoop);
        }
      };
      on(view, "pointerup", endPointer);
      on(view, "pointercancel", endPointer);

      setInsertionState(view, null, 0);
      createSlot();
      return view;
    },
  });
}
