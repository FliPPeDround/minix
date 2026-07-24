import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    // 测试里把 `minix` 解析到本包源码，而非 dist/index.mjs：
    // @minix/components/dist 的 `import { defineVaporComponent } from "minix"`
    // 若走到 dist（已 bundle @vue/shared 为 const），const 处于 TDZ →
    // "Cannot access 'isFunction' before initialization"。源码通过
    // `export * from "@vue/runtime-vapor"` 提供 live binding，无 TDZ。
    alias: {
      // 别名到 ESM-bundler 构建，避免 Vitest 解析到 CJS 构建：
      // CJS 构建中 initFeatureFlags 等被死代码消除，会导致 runtime-vapor 报错。
      "@vue/runtime-dom": "@vue/runtime-dom/dist/runtime-dom.esm-bundler.js",
      "@vue/runtime-core": "@vue/runtime-core/dist/runtime-core.esm-bundler.js",
      "@vue/runtime-vapor": "@vue/runtime-vapor/dist/runtime-vapor.esm-bundler.js",
      "@vue/reactivity": "@vue/reactivity/dist/reactivity.esm-bundler.js",
      "@vue/shared": "@vue/shared/dist/shared.esm-bundler.js",
      minix: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
    },
  },
  pack: {
    alias: {
      "@vue/runtime-dom": "@vue/runtime-dom/dist/runtime-dom.esm-bundler.js",
      "@vue/runtime-core": "@vue/runtime-core/dist/runtime-core.esm-bundler.js",
      "@vue/runtime-vapor": "@vue/runtime-vapor/dist/runtime-vapor.esm-bundler.js",
      "@vue/reactivity": "@vue/reactivity/dist/reactivity.esm-bundler.js",
      "@vue/shared": "@vue/shared/dist/shared.esm-bundler.js",
    },
    dts: {
      tsgo: true,
    },
    deps: {
      onlyBundle: [
        "@vue/reactivity",
        "@vue/runtime-core",
        "@vue/runtime-dom",
        "@vue/runtime-vapor",
        "@vue/shared",
        "csstype",
      ],
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
