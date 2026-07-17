import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AppJson } from "./types.ts";

/**
 * 封装 app.json 的加载与路由解析。
 * 持有小程序源码根目录（mpRoot）与解析后的 appJson，提供主包 + 分包页面路由查询。
 */
export class AppConfig {
  private appJson: AppJson = {};
  private readonly mpRoot: string;

  constructor(mpRoot: string) {
    this.mpRoot = mpRoot;
  }

  /** 重新读取 mpRoot/app.json；找不到或解析失败时抛错 */
  load(): void {
    this.appJson = JSON.parse(readFileSync(join(this.mpRoot, "app.json"), "utf-8"));
  }

  /** 主包 + 分包的全部页面路由 */
  pageRoutes(): string[] {
    const routes = [...(this.appJson.pages ?? [])];
    const subs = this.appJson.subpackages ?? this.appJson.subPackages ?? [];
    for (const sub of subs) {
      for (const page of sub.pages ?? []) {
        routes.push(sub.root ? `${sub.root}/${page}` : page);
      }
    }
    return routes;
  }
}
