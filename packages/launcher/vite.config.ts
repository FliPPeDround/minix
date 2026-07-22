import { readFileSync } from "node:fs";
import { defineConfig } from "vite-plus";

/**
 * rolldown 插件：处理 `?raw` 查询后缀，把文件内容作为字符串导出。
 * tsdown/rolldown 不像 Vite 那样内置 `?raw` 支持，这里补齐该能力。
 * resolver 已经会把 `@minix/toolbar?raw` 解析为 `<path>/index.html?raw`
 * 并保留查询后缀，所以只需在 load 钩子里剥离 `?raw` 读文件即可。
 */
function rawPlugin() {
  return {
    name: "minix:raw",
    load(id: string) {
      if (!id.endsWith("?raw")) return null;
      const filePath = id.slice(0, -"?raw".length);
      const content = readFileSync(filePath, "utf-8");
      return `export default ${JSON.stringify(content)}`;
    },
  };
}

export default defineConfig({
  run: {
    tasks: {
      dev: {
        command: "vp run build --watch",
        cache: false,
        dependsOn: ["@minix/toolbar#build"],
      },
      build: {
        command: "vp pack",
        dependsOn: ["@minix/toolbar#build"],
      },
    },
  },
  pack: {
    dts: {
      tsgo: true,
    },
    exports: true,
    plugins: [rawPlugin()],
  },
  test: {
    passWithNoTests: true,
  },
  fmt: {
    ignorePatterns: ["src/toolbar.html"],
  },
});
