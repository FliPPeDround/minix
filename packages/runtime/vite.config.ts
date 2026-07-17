import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    // 别名到 ESM-bundler 构建,避免 Vitest 解析到 CJS 构建
    // CJS 构建中 initFeatureFlags 等被死代码消除,会导致 runtime-vapor 报错
    alias: {
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
