import { match } from "path-to-regexp";
import { getAppConfig, __resetApp } from "./app.ts";
import { createPageInstance } from "./page.ts";
import type { CreatedPage, RenderFn } from "./page.ts";
import { applyStyle, removeStyle } from "./style.ts";

/** 页面注册信息：由 vite 插件注入的 createPage 工厂写入 */
export interface PageRegistration {
  path: string;
  options: Record<string, any>;
  render?: RenderFn;
  config: Record<string, any>;
  wxss?: string;
}

/**
 * 路由表项：每条记录对应一个已注册页面。
 *
 * 路径匹配复用 `path-to-regexp`（Express/Next/Nuxt/Koa 同款，周下载 1 亿+），
 * 而非手写 `Map.get(path)` 查表 —— 这样既能处理固定路径（`pages/index/index`），
 * 也为未来可能的动态路由参数（如 `pages/user/:id`）预留能力，匹配逻辑交给成熟库维护。
 *
 * 注意：小程序路由的「页面栈调度 / tabBar 缓存 / 生命周期 / 应用外壳 / wxss 注入」
 * 是小程序宿主特有语义，业界没有现成路由库覆盖，仍由本文件自维护。
 */
interface RouteEntry {
  /** 原始注册路径（已 normalize，无前导斜杠），用于显示与 tabBar 比较 */
  path: string;
  /** path-to-regexp 编译出的匹配函数，同步返回匹配结果或 false */
  matcher: (path: string) => { path: string; params: Record<string, string> } | false;
  registration: PageRegistration;
}

/** 按 path 查找已注册页面，返回注册信息与路径参数（无匹配返回 null） */
function resolveRoute(
  path: string,
): { registration: PageRegistration; params: Record<string, string> } | null {
  for (const entry of routes) {
    const result = entry.matcher(path);
    if (result) return { registration: entry.registration, params: result.params };
  }
  return null;
}

interface ManagedPage {
  instance: Record<string, any>;
  page: CreatedPage | null;
  container: HTMLElement;
  path: string;
}

interface NavCallbackOptions {
  success?: (res?: any) => void;
  fail?: (err: any) => void;
  complete?: (res?: any) => void;
}

export interface UrlOptions extends NavCallbackOptions {
  url: string;
}

export interface NavigateBackOptions extends NavCallbackOptions {
  delta?: number;
}

const routes: RouteEntry[] = [];
const stack: ManagedPage[] = [];
/** tabBar 页面首次挂载后缓存，再次切换只触发 onShow（与微信一致） */
const tabCache = new Map<string, ManagedPage>();
let activeTab = "";

// ---------------------------------------------------------------------------
// 路径与 URL

function normalizePath(p: string): string {
  return p.replace(/^\/+/, "");
}

function parseUrl(url: string): { path: string; query: Record<string, string> } {
  const [rawPath, rawQuery] = url.split("?");
  const query: Record<string, string> = {};
  if (rawQuery) {
    for (const [key, value] of new URLSearchParams(rawQuery)) {
      query[key] = value;
    }
  }
  return { path: normalizePath(decodeURIComponent(rawPath)), query };
}

function isTabPage(path: string): boolean {
  const list = getAppConfig().tabBar?.list ?? [];
  return list.some((item) => normalizePath(item.pagePath) === path);
}

// ---------------------------------------------------------------------------
// 应用外壳（导航栏 / 页面容器 / tabBar）与基础样式

const BASE_CSS = `
* { margin: 0; }
html, body { margin: 0; padding: 0; height: 100%; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", sans-serif;
  font-size: 14px;
  color: #1a1a1a;
  background: #fff;
}
.minix-shell { display: flex; flex-direction: column; height: 100vh; }
.minix-navbar {
  flex: none;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 16px;
  font-weight: 600;
}
.minix-pages { flex: 1; overflow: auto; position: relative; }
.minix-page { min-height: 100%; }
.minix-tabbar { flex: none; display: flex; border-top: 1px solid rgba(0, 0, 0, 0.1); }
.minix-tabbar-item {
  flex: 1;
  display: block;
  padding: 10px 0;
  background: none;
  border: none;
  font-size: 13px;
  text-align: center;
  cursor: pointer;
}
`;

interface AppShell {
  root: HTMLElement;
  navBar: HTMLElement;
  navTitle: HTMLElement;
  pages: HTMLElement;
  tabBar: HTMLElement | null;
}

let shell: AppShell | null = null;

function ensureShell(): AppShell {
  if (shell) return shell;
  applyStyle("minix:base", BASE_CSS);

  const root = document.createElement("div");
  root.className = "minix-shell";

  const navBar = document.createElement("div");
  navBar.className = "minix-navbar";
  const navTitle = document.createElement("div");
  navTitle.className = "minix-navbar-title";
  navBar.appendChild(navTitle);

  const pages = document.createElement("div");
  pages.className = "minix-pages";

  root.append(navBar, pages);
  document.body.appendChild(root);

  shell = { root, navBar, navTitle, pages, tabBar: null };
  return shell;
}

function updateNavBar(): void {
  if (!shell) return;
  const top = stack[stack.length - 1];
  const reg = top ? resolveRoute(top.path)?.registration : undefined;
  const win = getAppConfig().window ?? {};
  shell.navTitle.textContent =
    reg?.config?.navigationBarTitleText ?? win.navigationBarTitleText ?? "";
  shell.navBar.style.background = win.navigationBarBackgroundColor ?? "#ffffff";
  shell.navBar.style.color = win.navigationBarTextStyle === "white" ? "#fff" : "#000";
}

function renderTabBar(): void {
  if (!shell) return;
  shell.tabBar?.remove();
  shell.tabBar = null;

  const conf = getAppConfig().tabBar;
  if (!conf?.list?.length) return;

  const bar = document.createElement("div");
  bar.className = "minix-tabbar";
  bar.style.background = conf.backgroundColor ?? "#fff";

  for (const item of conf.list) {
    const path = normalizePath(item.pagePath);
    const btn = document.createElement("button");
    btn.className = "minix-tabbar-item";
    btn.textContent = item.text ?? path;
    btn.style.color =
      path === activeTab ? (conf.selectedColor ?? "#07c160") : (conf.color ?? "#999");
    btn.addEventListener("click", () => switchTab({ url: path }));
    bar.appendChild(btn);
  }

  shell.root.appendChild(bar);
  shell.tabBar = bar;
}

// ---------------------------------------------------------------------------
// 页面挂载 / 卸载 / 显隐

function mountManaged(path: string, query: Record<string, string>): ManagedPage | null {
  const resolved = resolveRoute(path);
  if (!resolved) {
    console.warn(`[minix] 页面未注册: ${path}`);
    return null;
  }
  const reg = resolved.registration;

  const container = document.createElement("div");
  container.className = "minix-page";
  container.dataset.route = path;
  (shell?.pages ?? document.body).appendChild(container);

  const created = createPageInstance({ ...reg.options, render: reg.render });
  const instance = created.instance as Record<string, any>;
  instance.route = path;

  const managed: ManagedPage = { instance, page: created, container, path };
  if (reg.wxss) applyStyle(`minix:page:${path}`, reg.wxss);

  // 与微信小程序一致：onLoad → 首次渲染 → onShow → onReady
  instance.onLoad?.(query);
  created.mount(container);
  instance.onShow?.();
  instance.onReady?.();
  return managed;
}

function unmountManaged(managed: ManagedPage): void {
  managed.instance.onUnload?.();
  managed.page?.unmount();
  managed.container.remove();
  removeStyle(`minix:page:${managed.path}`);
  if (tabCache.get(managed.path) === managed) tabCache.delete(managed.path);
}

function hideManaged(managed: ManagedPage): void {
  managed.instance.onHide?.();
  managed.container.style.display = "none";
}

function showManaged(managed: ManagedPage): void {
  managed.container.style.display = "";
  managed.instance.onShow?.();
}

// ---------------------------------------------------------------------------
// 页面注册

/**
 * 由 vite 插件注入到页面 js 的工厂：返回一个 `Page` 函数，
 * 调用时把页面选项（连同编译好的 render / 页面 json / wxss）注册到路由。
 */
export function createPage(
  path: string,
  extra?: { render?: RenderFn; config?: Record<string, any>; wxss?: string },
): (options: Record<string, any>) => void {
  const route = normalizePath(path);
  return (options) => {
    routes.push({
      path: route,
      matcher: match(route),
      registration: {
        path: route,
        options,
        render: extra?.render,
        config: extra?.config ?? {},
        wxss: extra?.wxss,
      },
    });
  };
}

export function getCurrentPages(): Record<string, any>[] {
  return stack.map((p) => p.instance);
}

/** 简单模式 Page() 挂载的页面也进入页面栈（内部使用） */
export function __pushLegacyPage(
  instance: Record<string, any>,
  page: CreatedPage,
  container: HTMLElement,
): void {
  stack.push({ instance, page, container, path: instance.route ?? "" });
}

// ---------------------------------------------------------------------------
// 路由 API

function settle(options: NavCallbackOptions, err?: any): void {
  if (err) options.fail?.(err);
  else options.success?.({});
  options.complete?.({});
}

export function navigateTo(options: UrlOptions): void {
  const { path, query } = parseUrl(options.url);
  if (isTabPage(path)) {
    return settle(options, new Error(`[minix] navigateTo 不能跳转 tabBar 页面: ${path}`));
  }
  const target = mountManaged(path, query);
  if (!target) return settle(options, new Error(`[minix] 页面未注册: ${path}`));
  const prev = stack[stack.length - 1];
  if (prev && prev !== target) hideManaged(prev);
  stack.push(target);
  updateNavBar();
  settle(options);
}

export function navigateBack(options: NavigateBackOptions = {}): void {
  const delta = options.delta ?? 1;
  let n = Math.min(delta, stack.length - 1);
  while (n-- > 0) {
    const top = stack.pop();
    if (top) unmountManaged(top);
  }
  const top = stack[stack.length - 1];
  if (top) {
    showManaged(top);
    if (isTabPage(top.path)) {
      activeTab = top.path;
      renderTabBar();
    }
  }
  updateNavBar();
  settle(options);
}

export function redirectTo(options: UrlOptions): void {
  const { path, query } = parseUrl(options.url);
  if (isTabPage(path)) {
    return settle(options, new Error(`[minix] redirectTo 不能跳转 tabBar 页面: ${path}`));
  }
  const top = stack.pop();
  if (top) unmountManaged(top);
  const target = mountManaged(path, query);
  if (!target) return settle(options, new Error(`[minix] 页面未注册: ${path}`));
  stack.push(target);
  updateNavBar();
  settle(options);
}

export function reLaunch(options: UrlOptions): void {
  const { path, query } = parseUrl(options.url);
  while (stack.length) unmountManaged(stack.pop()!);
  const target = mountManaged(path, query);
  if (!target) return settle(options, new Error(`[minix] 页面未注册: ${path}`));
  if (isTabPage(path)) {
    tabCache.set(path, target);
    activeTab = path;
  }
  stack.push(target);
  renderTabBar();
  updateNavBar();
  settle(options);
}

export function switchTab(options: UrlOptions): void {
  const { path } = parseUrl(options.url);
  if (!isTabPage(path)) {
    return settle(options, new Error(`[minix] switchTab 只能跳转 tabBar 页面: ${path}`));
  }
  // 清空当前栈：卸载非 tab 页，隐藏其他 tab 页
  while (stack.length) {
    const top = stack.pop()!;
    if (isTabPage(top.path)) {
      if (top.path !== path) hideManaged(top);
    } else {
      unmountManaged(top);
    }
  }
  let target: ManagedPage | null | undefined = tabCache.get(path);
  if (target) {
    showManaged(target);
  } else {
    target = mountManaged(path, {});
    if (!target) return settle(options, new Error(`[minix] 页面未注册: ${path}`));
    tabCache.set(path, target);
  }
  stack.push(target);
  activeTab = path;
  renderTabBar();
  updateNavBar();
  settle(options);
}

// ---------------------------------------------------------------------------
// 启动

/** 挂载应用外壳并打开入口页面（entryPagePath 或 pages 第一项） */
export function startApp(): void {
  ensureShell();
  const conf = getAppConfig();
  const firstRegistered = routes[0]?.path;
  const entry = normalizePath(conf.entryPagePath ?? conf.pages?.[0] ?? firstRegistered ?? "");
  if (!entry) {
    console.warn("[minix] 没有可启动的页面");
    return;
  }
  if (isTabPage(entry)) switchTab({ url: entry });
  else reLaunch({ url: entry });
}

/** 重置全部运行时状态（测试用） */
export function __resetMinixRuntime(): void {
  while (stack.length) {
    const top = stack.pop()!;
    top.page?.unmount();
    top.container.remove();
  }
  routes.length = 0;
  tabCache.clear();
  activeTab = "";
  shell?.root.remove();
  shell = null;
  __resetApp();
}
