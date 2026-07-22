import { defineConfig } from "vite-plus";
import { viteSingleFile } from "vite-plugin-singlefile";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    vue({
      features: {
        vapor: true,
        optionsAPI: false,
      },
    }),
    viteSingleFile(),
  ],
});
