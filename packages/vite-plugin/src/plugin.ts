import { existsSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { compile } from "@minix/compiler";
import type { Plugin } from "vite";
import { AppConfig } from "./app-config.ts";
import { RESOLVED_VIRTUAL_ENTRY_ID, VIRTUAL_ENTRY_ID, entryCode } from "./entry.ts";
import { injectAppImports, injectPageImports } from "./inject.ts";
import { transformWxss } from "./wxss.ts";
import type { MinixPluginOptions } from "./types.ts";

/**
 * minix 框架插件：把一个微信小程序源码目录（app.json + app.js + pages/*）
 * 变成可在浏览器运行的应用。
 *
 * 用法：
 *   // vite.config.ts
 *   import minix from "@minix/vite-plugin";
 *   export default defineConfig({ plugins: [minix({ root: "miniprogram" })] });
 *
 *   // src/main.ts
 *   import "virtual:minix/entry";
 */
export function minix(options: MinixPluginOptions = {}): Plugin {
  let viteRoot = "";
  let mpRoot = "";
  let appConfig: AppConfig;

  return {
    name: "vite-plugin-minix",
    enforce: "pre",

    configResolved(config) {
      viteRoot = config.root;
      mpRoot = resolve(viteRoot, options.root ?? ".");
      appConfig = new AppConfig(mpRoot);
      appConfig.load(); // 找不到 app.json 时在此抛出，报错信息更直接
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
