import { defineConfig } from "vite-plus";
import minix from "@minix/vite-plugin";

export default defineConfig({
  plugins: [minix({ root: "miniprogram", launcher: false })],
});
