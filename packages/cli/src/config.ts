import { relative, resolve } from "node:path";
import type { InlineConfig } from "vite";
import minix, { type MinixPluginOptions } from "@minix/vite-plugin";

/**
 * 构造 minix CLI 的默认 Vite 配置。
 *
 * 内置了 Vue Vapor 所需的 alias / define，用户无需自己写 vite.config.ts。
 * 小程序源码目录（mpRoot）由 resolve.ts 自动探测后传入。
 *
 * 不显式设置 Vite root —— 让 Vite 默认使用 process.cwd()，与 vite.config.ts 行为一致。
 *
 * @param cwd          用户执行 CLI 的工作目录
 * @param mpRoot       小程序源码目录（绝对路径，app.json 所在目录）
 * @param overrides    用户额外传入的配置覆盖（未来支持合并用户 vite.config.ts）
 * @param minixOptions 透传给 @minix/vite-plugin 的选项（如 launcher）
 */
export function createMinixViteConfig(
  cwd: string,
  mpRoot: string,
  overrides: InlineConfig = {},
  minixOptions: MinixPluginOptions = {},
): InlineConfig {
  // vite-plugin 的 root 选项是相对 vite root 的路径
  const pluginRoot = relative(cwd, mpRoot) || ".";

  const base: InlineConfig = {
    plugins: [minix({ ...minixOptions, root: pluginRoot })],
    define: {
      // esm-bundler 构建要求的编译期特性开关（vapor 模式不需要 options API）
      __VUE_OPTIONS_API__: "false",
      __VUE_PROD_DEVTOOLS__: "false",
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
    },
    resolve: {
      alias: {
        // 别名到 ESM-bundler 构建，避免解析到 CJS 构建导致 runtime-vapor 报错
        "@vue/runtime-dom": "@vue/runtime-dom/dist/runtime-dom.esm-bundler.js",
        "@vue/runtime-core": "@vue/runtime-core/dist/runtime-core.esm-bundler.js",
        "@vue/runtime-vapor": "@vue/runtime-vapor/dist/runtime-vapor.esm-bundler.js",
        "@vue/reactivity": "@vue/reactivity/dist/reactivity.esm-bundler.js",
        "@vue/shared": "@vue/shared/dist/shared.esm-bundler.js",
      },
    },
  };

  // 浅合并：overrides 优先级更高，允许后续扩展
  return {
    ...base,
    ...overrides,
    plugins: [...(base.plugins ?? []), ...(overrides.plugins ?? [])],
    define: { ...base.define, ...overrides.define },
    resolve: { ...base.resolve, ...overrides.resolve },
  };
}

/** 默认开发服务器端口 */
export const DEFAULT_PORT = 5173;

/** 默认构建产物输出目录（相对 cwd） */
export const DEFAULT_OUT_DIR = "dist";

/** 解析输出目录为绝对路径 */
export function resolveOutDir(cwd: string, out?: string): string {
  return resolve(cwd, out ?? DEFAULT_OUT_DIR);
}
