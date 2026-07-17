import { build } from "vite";
import { createMinixViteConfig, resolveOutDir } from "../config.ts";
import { resolveMpRoot } from "../resolve.ts";

export interface BuildOptions {
  /** 小程序源码目录（不传则自动探测） */
  root?: string;
  /** 输出目录，默认 dist */
  out?: string;
  /** 是否生成 sourcemap */
  sourcemap?: boolean;
}

/**
 * 构建小程序为可部署的静态网站。
 *
 * 与 dev 共用同一套 Vite 配置，仅切换为 build 模式。
 */
export async function buildApp(options: BuildOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const mpRoot = resolveMpRoot(options.root, cwd);
  const outDir = resolveOutDir(cwd, options.out);

  console.log(`[minix] 小程序源码目录: ${mpRoot}`);
  console.log(`[minix] 构建输出目录: ${outDir}`);

  const config = createMinixViteConfig(cwd, mpRoot, {
    build: {
      outDir,
      sourcemap: options.sourcemap ?? false,
    },
  });

  await build(config);
}
