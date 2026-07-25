import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    // 别名到 ESM-bundler 构建,避免 Vitest 解析到 CJS 构建
    // CJS 构建中 initFeatureFlags 等被死代码消除,会导致 runtime-vapor 报错
    alias: {
      // vitest 在 node 跑,import "vue" 会匹配 exports.import.node → index.mjs
      // (server 入口,无 vapor API)。强制解析到 esm-bundler 构建,拿到
      // export * from "@vue/runtime-vapor" 的全部 vapor helpers。
      vue: "vue/dist/vue.runtime.esm-bundler.js",
      "@vue/runtime-dom": "@vue/runtime-dom/dist/runtime-dom.esm-bundler.js",
      "@vue/runtime-core": "@vue/runtime-core/dist/runtime-core.esm-bundler.js",
      "@vue/runtime-vapor": "@vue/runtime-vapor/dist/runtime-vapor.esm-bundler.js",
      "@vue/reactivity": "@vue/reactivity/dist/reactivity.esm-bundler.js",
      "@vue/shared": "@vue/shared/dist/shared.esm-bundler.js",
      // 测试里把 `minix` 解析到源码而非 dist，避免
      // dist 里 bundled `const isFunction` 处于 TDZ 导致
      // @minix/components/dist 加载失败。
      minix: fileURLToPath(new URL("../minix/src/index.ts", import.meta.url)),
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
