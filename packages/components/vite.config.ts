import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    vue({
      features: {
        vapor: true,
      },
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("minix-"),
        },
      },
    }),
    dts({
      include: ["src"],
      outDirs: ["dist"],
      tsconfigPath: "./tsconfig.build.json",
      processor: "vue",
    }),
  ],
  resolve: {
    alias: {
      vue: "minix",
    },
  },
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
    },
    minify: "oxc",
    rolldownOptions: {
      external: ["vue", "minix"],
      output: {
        format: "es",
        entryFileNames: "index.mjs",
        paths: { vue: "minix" },
      },
    },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  test: {
    environment: "jsdom",
  },
  fmt: {},
});
