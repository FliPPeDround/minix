import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Rolldown 插件：处理 `?raw` 后缀导入，返回文件内容的字符串。
 *
 * Vite 原生支持 `import x from './file.html?raw'`，但 tsdown（vp pack 用的打包器）
 * 不认识这个后缀。此插件让 tsdown 也能正确解析 `?raw` 导入，把文件内容以
 * `export default "..."` 形式内联到产物里。
 */
function rawPlugin() {
  return {
    name: "raw-import",
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith("?raw")) return null;
      const realPath = source.slice(0, -4);
      const resolved = importer ? resolve(dirname(importer), realPath) : resolve(realPath);
      return { id: resolved + "?raw" };
    },
    load(id: string) {
      if (!id.endsWith("?raw")) return null;
      const filePath = id.slice(0, -4);
      const content = readFileSync(filePath, "utf-8");
      return `export default ${JSON.stringify(content)};`;
    },
  };
}

export default defineConfig({
  pack: {
    dts: {
      tsgo: true,
    },
    exports: true,
    plugins: [rawPlugin()],
  },
  plugins: [
    vue({
      features: {
        vapor: true,
        optionsAPI: false,
      },
    }),
  ],
  test: {
    passWithNoTests: true,
  },
  fmt: {
    ignorePatterns: ["src/toolbar.html"],
  },
});
