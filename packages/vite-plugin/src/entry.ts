import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import type { AppConfig } from "./app-config.ts";

/** 提供给应用入口 import 的虚拟模块 id */
export const VIRTUAL_ENTRY_ID = "virtual:minix/entry";
export const RESOLVED_VIRTUAL_ENTRY_ID = "\0" + VIRTUAL_ENTRY_ID;

/** 绝对路径转 vite 可解析的模块 id（root 内相对，root 外用 /@fs/） */
export function toViteId(absPath: string, viteRoot: string): string {
  const rel = relative(viteRoot, absPath).replace(/\\/g, "/");
  return rel.startsWith("..") ? `/@fs/${absPath.replace(/\\/g, "/")}` : `/${rel}`;
}

/**
 * 生成虚拟入口模块代码：依次 import app.js 与 app.json 中声明的所有页面 js，
 * 最后调用 startApp() 启动。缺失页面给出警告，不阻断启动。
 */
export function entryCode(viteRoot: string, mpRoot: string, appConfig: AppConfig): string {
  const lines: string[] = [];
  const appJs = join(mpRoot, "app.js");
  if (existsSync(appJs)) lines.push(`import ${JSON.stringify(toViteId(appJs, viteRoot))};`);
  for (const route of appConfig.pageRoutes()) {
    const pageJs = join(mpRoot, `${route}.js`);
    if (existsSync(pageJs)) {
      lines.push(`import ${JSON.stringify(toViteId(pageJs, viteRoot))};`);
    } else {
      console.warn(`[minix] app.json 中声明的页面不存在: ${route}`);
    }
  }
  lines.push(`import { startApp } from "minix";`, `startApp();`);
  return lines.join("\n");
}
