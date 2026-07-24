import { reactive } from "@vue/reactivity";
import { createVaporApp, defineVaporComponent } from "@vue/runtime-vapor";
import { __pushLegacyPage } from "./router.ts";
import { installMinixComponents } from "./components/index.ts";

type IAnyObject = WechatMiniprogram.IAnyObject;
type PageDataOption = WechatMiniprogram.Page.DataOption;
type PageCustomOption = WechatMiniprogram.Page.CustomOption;
type PageTrivialInstance = WechatMiniprogram.Page.TrivialInstance;

/**
 * 渲染上下文：把响应式 data 与绑定到 instance 的方法统一成一个扁平对象。
 *
 * compiler 生成的 render 通过 `_ctx.msg` 读数据、`_ctx.onTap` 调方法，
 * 因此 ctx 把 data 字段平铺出来，方法挂在外层，保证 `_ctx[key]` 的访问
 * 都能落到正确的响应式目标 / 绑定函数上。
 */
export type RenderContext = Record<string, any>;

/**
 * render 函数签名，与 compiler 生成代码一致：
 *   `export function render(_ctx, $props, $emit, $attrs, $slots) { ... }`
 * runtime 只负责传入 `_ctx`，其余参数由 Vue Vapor 在组件内部使用。
 */
export type RenderFn = (
  ctx: RenderContext,
  props?: any,
  emit?: any,
  attrs?: any,
  slots?: any,
) => Node | undefined;

export type PageOptions<
  TData extends PageDataOption = IAnyObject,
  TCustom extends PageCustomOption = IAnyObject,
> = WechatMiniprogram.Page.Options<TData, TCustom> & {
  /**
   * compiler 编译 WXML 后产出的 render 函数，签名 `render(_ctx, ...)`。
   * 兼容手写形式：`this` 仍指向 page instance，可用 `this.data.msg` / `this.onTap`。
   */
  render?: RenderFn;
};

export type PageInstance<
  TData extends PageDataOption = IAnyObject,
  TCustom extends PageCustomOption = IAnyObject,
> = WechatMiniprogram.Page.Instance<TData, TCustom>;

/** createPageInstance 的返回值：实例与挂载/卸载能力分离，
 *  使路由可以在挂载前触发 onLoad（与微信小程序一致）。 */
export interface CreatedPage {
  instance: PageTrivialInstance & Record<string, any>;
  mount(container: HTMLElement): void;
  unmount(): void;
}

/**
 * 从 Page options 创建页面实例（data 响应式、setData、方法绑定、render ctx），
 * 但不触碰 DOM。mount() 时才创建 vapor app 并渲染。
 */
export function createPageInstance(options: PageOptions<any, any>): CreatedPage {
  const opts = options as Record<string, any>;
  const data = reactive({ ...opts.data }) as Record<string, any>;

  const instance: Record<string, any> = {
    data,
    setData(newData: Record<string, any>, callback?: () => void) {
      Object.assign(data, newData);
      callback?.();
    },
  };

  // bind all methods (lifecycle + custom) to instance
  for (const key in opts) {
    if (key === "data" || key === "render") continue;
    if (typeof opts[key] === "function") {
      instance[key] = opts[key].bind(instance);
    }
  }

  const renderFn = opts.render;

  // 统一的渲染上下文：data 字段直接暴露（保持响应式），方法从 instance 取。
  // compiler 生成 `_ctx.msg` / `_ctx.onTap`，手写 `this.data.msg` / `this.onTap`
  // 两种写法都能正常工作。
  const ctx = new Proxy(data, {
    get(target, key) {
      if (Reflect.has(target, key)) return Reflect.get(target, key);
      if (Reflect.has(instance, key)) return Reflect.get(instance, key);
      return undefined;
    },
    has(target, key) {
      return Reflect.has(target, key) || Reflect.has(instance, key);
    },
    ownKeys(target) {
      return [...Reflect.ownKeys(target), ...Reflect.ownKeys(instance)];
    },
    getOwnPropertyDescriptor(target, key) {
      if (Reflect.has(target, key)) {
        return Reflect.getOwnPropertyDescriptor(target, key);
      }
      if (Reflect.has(instance, key)) {
        return Reflect.getOwnPropertyDescriptor(instance, key);
      }
      return undefined;
    },
  });

  let app: {
    mount(el: HTMLElement): void;
    unmount(): void;
    component(name: string, comp: any): unknown;
  } | null = null;

  return {
    instance: instance as PageTrivialInstance & Record<string, any>,
    mount(container: HTMLElement) {
      // this=instance 兼容手写 render；ctx 作为首参兼容 compiler 生成代码
      const Comp = defineVaporComponent(() => renderFn?.call(instance, ctx) ?? null);
      app = createVaporApp(Comp);
      // 注册 view/text/image/... 等内置组件，让 compiler 产出的 <minix-view> 能解析
      installMinixComponents(app);
      app.mount(container);
    },
    unmount() {
      app?.unmount();
      app = null;
    },
  };
}

/**
 * 简单模式：立即挂载到 document.body（playground / 单页场景）。
 * 多页面小程序项目由 vite 插件注入 createPage 注册，路由负责挂载。
 */
export function Page<
  TData extends PageDataOption = IAnyObject,
  TCustom extends PageCustomOption = IAnyObject,
>(options: PageOptions<TData, TCustom>): void {
  const container = document.createElement("div");
  container.className = "minix-page";
  document.body.appendChild(container);

  const page = createPageInstance(options);
  page.mount(container);
  __pushLegacyPage(page.instance, page, container);

  const inst = page.instance as Record<string, any>;
  inst.onLoad?.({});
  inst.onReady?.();
  inst.onShow?.();
}
