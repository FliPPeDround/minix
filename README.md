# 【实验性项目】MiniX

> 把微信小程序源码直接跑在浏览器里，基于 [Vue Vapor Mode](https://vuejs.org/)。

minix 让你保留现有的 `app.json` / `pages/*/*.wxml` / `*.wxss` / `*.js` 小程序源码不动，通过一个 Vite 插件把它变成浏览器里可运行的应用。底层由 Vue 的 Vapor Mode（无虚拟 DOM）驱动，编译期把 WXML 转成 Vue 模板语法再交给 `@vue/compiler-vapor` 生成 render 函数，运行时复用小程序的页面栈 / 生命周期 / tabBar 语义。

## 这个项目适合谁

- 想用小程序的语法在 Web 上做原型 / 演示 / 文档站
- 想把已有小程序代码迁移一部分到 H5，但不想重写视图层
- 想学习 WXML 编译原理或 Vue Vapor 内部实现

> minix 目前是**实验性**项目，不实现微信小程序全部能力，目标是覆盖常见的视图与路由场景。

## 架构

```
┌─────────────────────────────────────────────────────────────────┐
│  你的小程序源码  (app.json + app.js + app.wxss + pages/**/*)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  @minix/vite-plugin                                              │
│  ─ 虚拟入口 virtual:minix/entry 装配 app + pages                  │
│  ─ .wxml → @minix/compiler → render 函数模块                      │
│  ─ .wxss → CSS 字符串模块（运行时按页面维度注入/移除）              │
│  ─ .js   → 注入 createApp / createPage / render / wxss import     │
│  ─ rpx → vw 转换，HMR                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  @minix/compiler                                                 │
│  ─ WXML → Vue 模板语法（wx:if → v-if、wx:for → v-for、            │
│    bind:tap → @click、{{ }} 表达式 → v-bind / 文本插值）           │
│  ─ 内置组件加 minix- 前缀（view → minix-view）避免与浏览器默认     │
│    样式冲突，由 runtime 注册的同名组件渲染对应 HTML 元素            │
│  ─ 交给 @vue/compiler-vapor 产出 render 函数                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  @minix/runtime (re-exported as `minix`)                         │
│  ─ App() / Page() / setData / getApp / getCurrentPages           │
│  ─ 路由：navigateTo / navigateBack / redirectTo / reLaunch /     │
│    switchTab，带页面栈与 tabBar 缓存                              │
│  ─ 应用外壳：导航栏 + 页面容器 + tabBar                            │
│  ─ 内置组件：<minix-view> / <minix-text> / <minix-image> /        │
│    <minix-button> / <minix-input> / <minix-scroll-view> / ...    │
│  ─ 生命周期：onLoad / onShow / onReady / onHide / onUnload        │
└─────────────────────────────────────────────────────────────────┘
```

## 包

| 包                                             | 说明                                            |
| ---------------------------------------------- | ----------------------------------------------- |
| [`minix`](./packages/minix)                    | 用户统一入口，re-export 运行时全部 API          |
| [`@minix/vite-plugin`](./packages/vite-plugin) | Vite 插件，把 `miniprogram/` 目录变成可运行应用 |
| [`@minix/compiler`](./packages/compiler)       | WXML → Vue Vapor render 函数编译器              |
| [`@minix/runtime`](./packages/runtime)         | 浏览器里的小程序运行时                          |

## 快速开始

### 环境要求

- Node.js `>=22.18.0`
- pnpm `>=11.13.0`

### 安装与运行 demo

仓库里带了 [playground/demo](./playground/demo)，是一个完整的小程序示例（首页 / 详情页 / 个人中心，带 tabBar）。

```bash
git clone https://github.com/flippedround/minix.git
cd minix
pnpm install
pnpm run dev:demo
```

浏览器打开 Vite 打印的本地地址，应该能看到小程序跑起来。

### 接入到自己的项目

1. 安装依赖（发布后；目前请用 workspace 引用）：

```bash
pnpm add minix @minix/vite-plugin
```

2. 配置 Vite：

```ts
// vite.config.ts
import { defineConfig } from "vite";
import minix from "@minix/vite-plugin";

export default defineConfig({
  plugins: [minix({ root: "miniprogram" })],
  define: {
    __VUE_OPTIONS_API__: "false",
    __VUE_PROD_DEVTOOLS__: "false",
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
  },
  resolve: {
    alias: {
      "@vue/runtime-dom": "@vue/runtime-dom/dist/runtime-dom.esm-bundler.js",
      "@vue/runtime-core": "@vue/runtime-core/dist/runtime-core.esm-bundler.js",
      "@vue/runtime-vapor": "@vue/runtime-vapor/dist/runtime-vapor.esm-bundler.js",
      "@vue/reactivity": "@vue/reactivity/dist/reactivity.esm-bundler.js",
      "@vue/shared": "@vue/shared/dist/shared.esm-bundler.js",
    },
  },
});
```

3. 应用入口只写一行，插件会解析 `miniprogram/app.json` 自动装配：

```ts
// src/main.ts
import "virtual:minix/entry";
```

4. 按小程序原样写源码：

```
miniprogram/
├── app.json
├── app.js
├── app.wxss
└── pages/
    └── index/
        ├── index.js
        ├── index.json
        ├── index.wxml
        └── index.wxss
```

```js
// miniprogram/pages/index/index.js
import { navigateTo } from "minix";

Page({
  data: { count: 0 },
  inc() {
    this.setData({ count: this.data.count + 1 });
  },
});
```

```html
<!-- miniprogram/pages/index/index.wxml -->
<view class="container">
  <text>{{count}}</text>
  <button bind:tap="inc">+1</button>
</view>
```

## 支持的 WXML 特性

- ✅ `{{ expr }}` 文本插值与属性绑定
- ✅ `wx:if` / `wx:elif` / `wx:else`
- ✅ `wx:for` / `wx:for-item` / `wx:for-index` / `wx:key`
- ✅ 事件绑定：`bind:` / `catch:` / `capture-bind:` / `capture-catch:` / `mut-bind:`，`tap` 自动映射为 `click`
- ✅ 内置组件：`view` / `text` / `image` / `icon` / `navigator` / `button` / `input` / `textarea` / `scroll-view` / `swiper` / `picker` / `form` / `checkbox` / `radio` / `slider` / `switch` / `label` / `progress` / `rich-text`
- ✅ `<block>` 作为逻辑容器
- ✅ WXSS 选择器中的小程序标签名（`view { ... }`）会同步转成 `minix-view`
- ✅ `rpx` 单位自动转换

## 路由 API

与微信小程序同名：`navigateTo` / `navigateBack` / `redirectTo` / `reLaunch` / `switchTab` / `getCurrentPages` / `getApp`，签名一致。tabBar 页面会按微信语义缓存，切换只触发 `onShow`。

## 开发

本项目使用 [Vite+](https://viteplus.dev/guide/) 作为统一工具链（包含 Vite / Rolldown / Vitest / Oxlint / Oxfmt / tsdown）。

```bash
pnpm install        # 安装依赖
pnpm run dev:demo   # 启动 playground demo

pnpm run -r test    # 跑所有包的测试
pnpm run -r build   # 构建所有包
pnpm run ready      # check + test + build，提交前自检
```

## Roadmap

> 勾选状态对应当前主分支的实现进度，未勾选项表示计划中或部分实现。

### 编译器（@minix/compiler）

- [x] WXML → Vue 模板语法转换（`wx:if` / `wx:for` / `{{ }}` / 事件绑定）
- [x] 内置组件统一 `minix-` 前缀，避免与浏览器默认样式冲突
- [x] `<block>` 逻辑容器映射为 `<template>`
- [x] 事件绑定 `bind:` / `catch:` / `capture-bind:` / `capture-catch:` / `mut-bind:`，`tap` → `click`
- [x] `wx:key` → `:key` 自动补 `item.` 前缀
- [ ] `<template>` 模板定义与 `<import>` / `<include>` 引用机制
- [ ] `wxs` 模块解析与调用
- [ ] `data` 数据绑定在 `wx:for` 与 `wx:if` 嵌套场景下的边界 case
- [ ] sourcemap 回映射到原始 WXML

### 样式（WXSS）

- [x] WXSS 选择器中小程序标签名同步转 `minix-*`（基于 postcss）
- [x] `rpx` → `vw` 自动转换
- [x] app.wxss 全局注入 + 页面 wxss 按页面维度注入/移除
- [ ] `@import` 语句解析与合并
- [ ] 全局样式与页面样式的优先级规则对齐微信实现
- [ ] 内联 `style` 与 `class` 的响应式合并策略

### 运行时（@minix/runtime）

- [x] `App()` / `Page()` / `setData` / `getApp` / `getCurrentPages`
- [x] 路由 API：`navigateTo` / `navigateBack` / `redirectTo` / `reLaunch` / `switchTab`，含页面栈与 tabBar 缓存
- [x] 应用外壳：导航栏 + 页面容器 + tabBar
- [x] 页面生命周期：`onLoad` / `onShow` / `onReady` / `onHide` / `onUnload`
- [x] App 生命周期：`onLaunch` / `onShow`
- [x] 内置组件：`view` / `text` / `image` / `icon` / `navigator` / `button` / `input` / `textarea` / `scroll-view` / `swiper` / `picker` / `form` / `checkbox` / `radio` / `slider` / `switch` / `label` / `progress` / `rich-text`
- [ ] `Component()` 自定义组件构造器与 `behaviors` / `relations`
- [ ] `observers` 数据监听器与 `lifetimes` / `pageLifetimes`
- [ ] `setData` 细粒度更新（路径表达式 `a.b.c`、diff 优化）
- [ ] `wx.*` 常用 API：`request` / `showToast` / `showModal` / `storage` / `navigateToMiniProgram` 等
- [ ] 组件 `slot` 命名插槽与作用域插槽
- [ ] 现有组件属性补齐（如 `picker` 多列、`swiper` 完整属性、`image` 完整 `mode`）
- [ ] `movable-view` / `cover-view` / `map` / `canvas` / `video` / `audio` / `web-view` 等扩展组件

### Vite 插件（@minix/vite-plugin）

- [x] 虚拟入口 `virtual:minix/entry` 装配 app + pages
- [x] `.wxml` / `.wxss` / `.js` 文件转换与 import 注入
- [x] 自动生成 `index.html`（dev / build 两种模式）
- [x] 全页 HMR（wxml / wxss / json 变更触发刷新）
- [ ] 局部 HMR：wxml render 函数热替换，避免整页刷新
- [ ] app.json 变更后增量更新路由表，不重载整页
- [ ] 多端构建产物（H5 / 桌面）

### CLI（@minix/cli）

- [x] `minix dev` 启动开发服务器
- [x] `minix build` 构建静态站点
- [x] `--launcher` / `--device` 选项透传
- [ ] `minix create` 脚手架创建新项目
- [ ] `minix check` 项目体检（依赖 / 配置 / 兼容性）
- [ ] 自定义设备配置文件（`minix.config.ts` 中扩展设备预设）

### Launcher（@minix/launcher）

- [x] 基于 `@webviewjs/webview` 的原生窗口
- [x] 紧凑 toolbar：设备切换 / DevTools / 置顶 / reload
- [x] 设备预设（iPhone 15 Pro / SE / Max、Pixel 7、Galaxy S23、iPad Pro 11 等）
- [x] 近似移动端模拟（UA override / viewport meta / touch 事件转换 / `matchMedia` polyfill）
- [ ] 设备旋转（横竖屏切换）
- [ ] 网络面板（请求拦截 / mock）
- [ ] Storage 面板（查看 / 编辑 `wx.storage`）
- [ ] 性能面板（渲染耗时 / 内存采样）
- [ ] 真机预览（扫码 / 远程调试协议）

### 工具链与工程化

- [x] 统一 Vite+ 工具链（Vite / Rolldown / Vitest / Oxlint / Oxfmt / tsdown）
- [x] pnpm workspace 多包管理
- [x] compiler / vite-plugin 单元测试
- [ ] runtime 在 jsdom 下的单测稳定化（解决 `document is not defined`）
- [ ] 端到端测试覆盖 playground demo
- [ ] Vue Devtools 集成
- [ ] 完整的 TypeScript 类型导出与 `.d.ts` 校验

### 文档与生态

- [x] 仓库 README 与架构图
- [x] playground/demo 示例（首页 / 详情页 / 个人中心 + tabBar）
- [x] playground/cli-demo（CLI 入口示例）
- [ ] 文档站点（组件 API / 路由 API / 迁移指南）
- [ ] 从微信小程序迁移到 minix 的逐步指南
- [ ] 更多 playground 示例（表单 / 列表 / 网络请求 / 自定义组件）

## 项目状态

实验性项目，正在积极开发中。API 可能会变。欢迎提 issue 讨论。

## License

[MIT](./LICENSE) © FlippedRound
