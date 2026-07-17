import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { compile } from "@minix/compiler";
import type { Plugin } from "vite";
import { AppConfig } from "./app-config.ts";
import { RESOLVED_VIRTUAL_ENTRY_ID, VIRTUAL_ENTRY_ID, entryCode } from "./entry.ts";
import { injectAppImports, injectPageImports } from "./inject.ts";
import { transformWxss } from "./wxss.ts";
import type { MinixPluginOptions } from "./types.ts";

/** 生成默认的 index.html：引用虚拟入口模块，由 Vite 处理 module 脚本。
 *  使用 /@id/ 前缀让浏览器直接请求 Vite 解析后的虚拟模块 URL */
function defaultIndexHtml(): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>minix</title>
  </head>
  <body>
    <script type="module" src="/@id/${VIRTUAL_ENTRY_ID}"></script>
  </body>
</html>`;
}

/** 项目根目录是否已存在 index.html */
function hasIndexHtml(root: string): boolean {
  return existsSync(resolve(root, "index.html"));
}

/**
 * minix 框架插件：把一个微信小程序源码目录（app.json + app.js + pages/*）
 * 变成可在浏览器运行的应用。
 *
 * 用法：
 *   // vite.config.ts
 *   import minix from "@minix/vite-plugin";
 *   export default defineConfig({ plugins: [minix({ root: "miniprogram" })] });
 *
 * 插件内部会自动生成 index.html 与入口模块，用户无需手写 HTML 或 src/main.ts。
 * 若项目根目录已存在 index.html，则沿用用户的（向后兼容）。
 */
export function minix(options: MinixPluginOptions = {}): Plugin {
  let viteRoot = "";
  let mpRoot = "";
  let appConfig: AppConfig;

  return {
    name: "vite-plugin-minix",
    enforce: "pre",

    config(userConfig, { command }) {
      // build 模式下若没有 index.html，在 cacheDir 生成一个并设为 rollup 入口
      // （vite:build-html 用 fs.readFile 读 HTML，必须落盘真实文件）
      if (command === "build") {
        const root = resolve(userConfig.root ?? process.cwd());
        if (!hasIndexHtml(root)) {
          const cacheDir = userConfig.cacheDir ?? join(root, "node_modules/.vite");
          if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
          const htmlPath = join(cacheDir, "minix-index.html");
          writeFileSync(htmlPath, defaultIndexHtml());
          return {
            build: { rollupOptions: { input: htmlPath } },
          };
        }
      }
    },

    configResolved(config) {
      viteRoot = config.root;
      mpRoot = resolve(viteRoot, options.root ?? ".");
      appConfig = new AppConfig(mpRoot);
      appConfig.load(); // 找不到 app.json 时在此抛出，报错信息更直接
    },

    configureServer(server) {
      // dev 模式：项目根目录无 index.html 时，拦截根路径返回虚拟 HTML
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || "").split("?")[0];
        if (url !== "/" && url !== "/index.html") return next();
        if (hasIndexHtml(viteRoot)) return next();

        const html = await server.transformIndexHtml(url, defaultIndexHtml());
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.end(html);
      });
    },

    resolveId(id) {
      if (id === VIRTUAL_ENTRY_ID) return RESOLVED_VIRTUAL_ENTRY_ID;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_ENTRY_ID) return entryCode(viteRoot, mpRoot, appConfig);
    },

    transform(code, id) {
      const filePath = id.split("?")[0];
      if (!filePath.startsWith(mpRoot)) return null;

      // .wxml → render 函数模块（产物 import 'minix'，由使用者的 minix 包解析）
      if (filePath.endsWith(".wxml")) {
        return { code: compile(code), map: null };
      }

      // .wxss → 导出 CSS 字符串的 JS 模块，运行时按页面维度注入/移除
      if (filePath.endsWith(".wxss")) {
        return { code: `export default ${JSON.stringify(transformWxss(code))};`, map: null };
      }

      if (filePath.endsWith(".js")) {
        const route = relative(mpRoot, filePath).replace(/\\/g, "/").replace(/\.js$/, "");
        const dir = dirname(filePath);
        if (route === "app") {
          return {
            code: injectAppImports(code, { hasWxss: existsSync(join(dir, "app.wxss")) }),
            map: null,
          };
        }
        if (appConfig.pageRoutes().includes(route)) {
          const base = basename(filePath, ".js");
          return {
            code: injectPageImports(code, {
              route,
              basename: base,
              hasJson: existsSync(join(dir, `${base}.json`)),
              hasWxss: existsSync(join(dir, `${base}.wxss`)),
            }),
            map: null,
          };
        }
      }
      return null;
    },

    handleHotUpdate({ file, server }) {
      if (!file.startsWith(mpRoot)) return;
      if (/\.(wxml|wxss|json)$/.test(file)) {
        if (file.endsWith("app.json")) {
          try {
            appConfig.load();
          } catch {
            // json 写坏了等下一次保存，不阻断刷新
          }
        }
        // wxml render / wxss 都挂在页面注册信息里，局部 HMR 意义不大，整页刷新最可靠
        server.ws.send({ type: "full-reload" });
        return [];
      }
    },
  };
}

export default minix;
