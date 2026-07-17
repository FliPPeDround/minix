import {
  createSlot,
  defineVaporComponent,
  insert,
  template,
  type VaporComponent,
} from "@vue/runtime-vapor";

/**
 * 内置组件共享工具。
 *
 * minix-* 组件必须用 Vapor 原生 API（template + setup 返回 block），
 * 而非标准 Vue 的 defineComponent + h：Vapor app 调用 setup 时期待返回
 * 一个 block（真实 DOM 节点），标准 Vue 的 render 函数会被判为
 * "non-block value" 导致渲染为空。
 *
 * 组件根元素统一用 `minix-*` 自定义元素标签，而非 div/span 等原生标签：
 *  1. 避免与浏览器默认样式冲突（div 的 block 默认、p 的 margin 等）
 *  2. 让 WXSS 里的 `view { ... }` 编译成 `minix-view { ... }` 后能直接
 *     匹配到 DOM 节点
 *  3. 语义清晰，调试时一眼能看出是小程序组件
 *
 * attrs 透传由 vapor 编译产物里的 createAssetComponent /
 * createComponentWithFallback 在组件外部处理；slots 需要显式用
 * createSlot + insert 插入根节点（Vapor 不会自动插入）。
 */

const templateCache = new Map<string, ReturnType<typeof template>>();

/** 取/缓存给定 HTML 模板的 template 工厂 */
function getTemplate(html: string): ReturnType<typeof template> {
  let t = templateCache.get(html);
  if (!t) {
    t = template(html);
    templateCache.set(html, t);
  }
  return t;
}

/**
 * 创建一个「可包含子节点」的 Vapor 组件：渲染 `minix-<name>` 自定义元素，
 * 并把默认 slot 内容插入到根节点中。用于 view / text / label 这类
 * 透明包裹组件。
 *
 * @param name 组件标签名（含 minix- 前缀，如 "minix-view"）
 * @param defaultStyle 自定义元素默认无样式，view 这类块级组件需传
 *   "display:block" 等默认布局样式，对齐小程序内置行为
 */
export function defineSlotElementComponent(name: string, defaultStyle?: string): VaporComponent {
  const html = defaultStyle ? `<${name} style="${defaultStyle}"></${name}>` : `<${name}></${name}>`;
  const t = getTemplate(html);
  return defineVaporComponent({
    name,
    setup() {
      const root = t();
      const slot = createSlot("default", null);
      insert(slot, root as ParentNode & { $fc?: Node | null });
      return root;
    },
  });
}

/**
 * 把默认 slot 插入到给定根节点。用于自定义 setup 但需要渲染子节点的
 * 组件（如 scroll-view / swiper / button / form）。
 */
export function insertDefaultSlot(root: Node): void {
  const slot = createSlot("default", null);
  insert(slot, root as ParentNode & { $fc?: Node | null });
}

/** 取/缓存给定 HTML 模板的 template 工厂（导出版，供各组件文件复用） */
export function compileTemplate(html: string): ReturnType<typeof template> {
  return getTemplate(html);
}
