import { defineConfig } from "vite-plus";
import minix from "@minix/vite-plugin";

export default defineConfig({
  plugins: [minix({ root: "miniprogram" })],
  define: {
    // esm-bundler 构建要求的编译期特性开关（vapor 模式不需要 options API）
    __VUE_OPTIONS_API__: "false",
    __VUE_PROD_DEVTOOLS__: "false",
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
  },
  resolve: {
    alias: {
      // 别名到 ESM-bundler 构建，避免解析到 CJS 构建导致 runtime-vapor 报错
      "@vue/runtime-dom": "@vue/runtime-dom/dist/runtime-dom.esm-bundler.js",
      "@vue/runtime-core": "@vue/runtime-core/dist/runtime-core.esm-bundler.js",
      "@vue/runtime-vapor": "@vue/runtime-vapor/dist/runtime-vapor.esm-bundler.js",
      "@vue/reactivity": "@vue/reactivity/dist/reactivity.esm-bundler.js",
      "@vue/shared": "@vue/shared/dist/shared.esm-bundler.js",
    },
  },
});
