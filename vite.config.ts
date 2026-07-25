import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  plugins: [
    // 根级 `vp test` 会收集 components 包的测试，其源码 import .vue 文件，
    // 需要 Vue SFC 插件才能编译。与 packages/components/vite.config.ts 一致：
    // vapor 模式 + minix-* 作为自定义元素。
    vue({
      features: { vapor: true },
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("minix-"),
        },
      },
    }),
  ],
  resolve: {
    // 根级 `vp test` 会跨包收集测试文件，但只使用根 vite.config.ts，
    // 不会读取各包的 resolve.alias。这里集中放置跨包测试所需的别名，
    // 让从根运行 `vp test` 时 minix / components / vite-plugin 的测试
    // 都能正确解析模块。
    alias: {
      // 把 `minix` 解析到源码而非 dist，让跨包测试拿到 live binding。
      minix: fileURLToPath(new URL("./packages/minix/src/index.ts", import.meta.url)),
      // vitest 在 node 跑，import "vue" 会匹配 exports.import.node → index.mjs
      // （server 入口，无 vapor API）。强制解析到 esm-bundler 构建，拿到
      // export * from "@vue/runtime-vapor" 的全部 vapor helpers。
      vue: "vue/dist/vue.runtime.esm-bundler.js",
      // @vue/* 子包同样要 alias 到 esm-bundler 构建：CJS 构建中
      // initFeatureFlags 等被死代码消除，会导致 runtime-vapor 报错。
      "@vue/runtime-dom": "@vue/runtime-dom/dist/runtime-dom.esm-bundler.js",
      "@vue/runtime-core": "@vue/runtime-core/dist/runtime-core.esm-bundler.js",
      "@vue/runtime-vapor": "@vue/runtime-vapor/dist/runtime-vapor.esm-bundler.js",
      "@vue/reactivity": "@vue/reactivity/dist/reactivity.esm-bundler.js",
      "@vue/shared": "@vue/shared/dist/shared.esm-bundler.js",
    },
  },
  fmt: {},
  test: {
    // jsdom 环境：minix / components / vite-plugin 的测试需要 DOM
    environment: "jsdom",
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
  },
});
