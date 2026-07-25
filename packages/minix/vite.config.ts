import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    // 测试里把 `minix` 解析到本包源码，而非 dist/index.mjs：
    // dist 已经把 vue external，测试直接走源码 + node_modules/vue 主包。
    alias: {
      minix: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      // vitest 在 node 跑，import "vue" 会匹配 exports.import.node → index.mjs
      // （server 入口，无 vapor API）。强制解析到 esm-bundler 构建。
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
  pack: {
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  test: {
    environment: "jsdom",
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
