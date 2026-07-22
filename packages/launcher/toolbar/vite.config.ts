import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 把构建产物中的 <script src="..."> 和 <link rel="stylesheet" href="...">
 * 内联到 HTML 里，生成单个自包含的 toolbar.html 文件。
 *
 * webviewjs 的 createWebview({ html }) 只接受单个 HTML 字符串，
 * 无法引用外部 JS/CSS 文件，所以必须内联。
 *
 * 使用 writeBundle 钩子在磁盘上做后处理：Rolldown 不支持在 generateBundle
 * 里直接修改 bundle 对象，所以等 Vite 写完文件后再读取、内联、重写。
 */
function inlineSingleFile(): import("vite-plus").Plugin {
  return {
    name: "inline-single-file",
    enforce: "post",
    writeBundle(options) {
      const outDir = options.dir;
      if (!outDir) return;

      const htmlPath = resolve(outDir, "index.html");
      if (!existsSync(htmlPath)) return;

      let html = readFileSync(htmlPath, "utf-8");

      // 内联 <script type="module" crossorigin src="/assets/xxx.js"></script>
      html = html.replace(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g, (match, src: string) => {
        const filePath = resolvePublicPath(src, outDir);
        if (!filePath || !existsSync(filePath)) return match;
        const code = readFileSync(filePath, "utf-8");
        return `<script type="module">\n${code}\n</script>`;
      });

      // 内联 <link rel="stylesheet" crossorigin href="/assets/xxx.css">
      html = html.replace(
        /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
        (match, href: string) => {
          const filePath = resolvePublicPath(href, outDir);
          if (!filePath || !existsSync(filePath)) return match;
          const code = readFileSync(filePath, "utf-8");
          return `<style>\n${code}\n</style>`;
        },
      );

      // 写入 ../src/toolbar.html
      const targetPath = resolve(__dirname, "../src/toolbar.html");
      writeFileSync(targetPath, html, "utf-8");

      // 清理 dist 目录（中间产物，不需要保留）
      rmSync(outDir, { recursive: true, force: true });
    },
  };
}

/** 把 /assets/xxx.js 这样的 public 路径解析到磁盘上的实际文件 */
function resolvePublicPath(url: string, outDir: string): string | null {
  // 去掉 query 和 hash
  const clean = url.split("?")[0].split("#")[0];
  // 去掉开头的 /
  const rel = clean.startsWith("/") ? clean.slice(1) : clean;
  return resolve(outDir, rel);
}

export default defineConfig({
  root: __dirname,
  plugins: [vue(), inlineSingleFile()],
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  fmt: {},
});
