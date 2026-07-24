import {
  createSlot,
  defineVaporComponent,
  renderEffect,
  setInsertionState,
  template,
} from "@vue/runtime-vapor";
import { pushStyle } from "../../../style.ts";
import matchMediaCss from "./match-media.css?inline";
import { matchMediaProps } from "./props.ts";

pushStyle("minix:components", matchMediaCss);

/**
 * 把 prop 值归一为 px 字符串；无法解析为数字时返回 null（不参与 query）。
 * min-width="800" 这类静态属性会以字符串形式传入，故统一走 Number 转换。
 */
function toPx(v: unknown): string | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : `${n}px`;
}

/**
 * 根据当前 props 拼装 CSS media query 字符串。
 * 各维度独立可选，全部用 `and` 连接，与小程序「同时满足才展示」语义一致。
 */
function buildQuery(props: Record<string, any>): string {
  const parts: string[] = [];
  const w = toPx(props.width);
  const minW = toPx(props.minWidth);
  const maxW = toPx(props.maxWidth);
  const h = toPx(props.height);
  const minH = toPx(props.minHeight);
  const maxH = toPx(props.maxHeight);
  const orient = props.orientation;
  if (w) parts.push(`(width: ${w})`);
  if (minW) parts.push(`(min-width: ${minW})`);
  if (maxW) parts.push(`(max-width: ${maxW})`);
  if (h) parts.push(`(height: ${h})`);
  if (minH) parts.push(`(min-height: ${minH})`);
  if (maxH) parts.push(`(max-height: ${maxH})`);
  if (orient === "landscape" || orient === "portrait") {
    parts.push(`(orientation: ${orient})`);
  }
  return parts.join(" and ");
}

/**
 * match-media：media query 匹配检测节点。
 *
 * 小程序语义：指定一组 media query 规则（min-width / max-width / width /
 * min-height / max-height / height / orientation），仅当页面视口满足全部
 * 规则时才展示子节点，否则隐藏（display:none）。
 *
 * 实现：根据 props 拼装 CSS media query 字符串，用 window.matchMedia 求值；
 * 监听 MediaQueryList 的 change 事件，在视口尺寸/方向变化时实时切换可见性。
 * props 变化时 renderEffect 自动重跑，重建 query 并替换旧的监听。
 */
export default function MatchMedia() {
  const t = template(`<minix-match-media>`);
  return defineVaporComponent({
    name: "minix-match-media",
    props: matchMediaProps,
    setup(props) {
      const view = t() as HTMLElement;

      let mql: MediaQueryList | null = null;
      const apply = () => {
        view.style.display = mql && mql.matches ? "" : "none";
      };

      renderEffect(() => {
        // 上一轮的 query 失效前先解绑，避免累积多个监听
        if (mql) {
          mql.removeEventListener("change", apply);
          mql = null;
        }
        const query = buildQuery(props);
        if (query && typeof window !== "undefined" && typeof window.matchMedia === "function") {
          mql = window.matchMedia(query);
          mql.addEventListener("change", apply);
        }
        apply();
      });

      setInsertionState(view, null, 0);
      createSlot();
      return view;
    },
  });
}
