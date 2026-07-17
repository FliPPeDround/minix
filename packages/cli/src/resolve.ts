import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

interface ProjectConfig {
  miniprogramRoot?: string;
}

/** 读取并解析 JSON 文件，失败返回 null */
function readJson<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

/**
 * 自动探测小程序源码目录（app.json 所在目录）。
 *
 * 优先级：
 *   1. 显式传入的 root 参数（--root）
 *   2. project.config.json 的 miniprogramRoot 字段
 *   3. 当前目录下存在 miniprogram/ 子目录
 *   4. 当前目录直接包含 app.json
 *
 * 找不到时抛出明确错误，避免后续 Vite 启动时报含糊的路径错误。
 */
export function resolveMpRoot(explicit?: string, cwd: string = process.cwd()): string {
  // 1. 显式参数
  if (explicit) {
    const abs = resolve(cwd, explicit);
    if (!existsSync(abs)) {
      throw new Error(`[minix] 指定的 root 目录不存在: ${explicit}`);
    }
    return abs;
  }

  // 2. project.config.json 的 miniprogramRoot
  const projectConfigPath = resolve(cwd, "project.config.json");
  const projectConfig = readJson<ProjectConfig>(projectConfigPath);
  if (projectConfig?.miniprogramRoot) {
    const abs = resolve(cwd, projectConfig.miniprogramRoot);
    if (existsSync(resolve(abs, "app.json"))) return abs;
  }

  // 3. miniprogram/ 子目录
  const miniprogramDir = resolve(cwd, "miniprogram");
  if (existsSync(resolve(miniprogramDir, "app.json"))) return miniprogramDir;

  // 4. 当前目录
  if (existsSync(resolve(cwd, "app.json"))) return cwd;

  throw new Error(
    `[minix] 未找到 app.json。请通过 --root <dir> 指定小程序源码目录，或在小程序项目根目录运行命令。`,
  );
}

/** 判断路径是否为目录 */
export function isDirectory(filePath: string): boolean {
  try {
    return statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}
