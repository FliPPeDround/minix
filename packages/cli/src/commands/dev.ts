import { createServer } from "vite";
import { createMinixViteConfig, DEFAULT_PORT } from "../config.ts";
import { resolveMpRoot } from "../resolve.ts";

export interface DevOptions {
  /** 小程序源码目录（不传则自动探测） */
  root?: string;
  /** 端口号 */
  port?: number;
  /** 主机名，默认 localhost */
  host?: string;
  /** 是否自动打开浏览器 */
  open?: boolean;
  /** 是否启动原生 launcher 窗口 */
  launcher?: boolean;
  /** launcher 初始设备名称 */
  device?: string;
}

/**
 * 启动开发服务器：把当前目录下的微信小程序源码在浏览器中跑起来。
 *
 * 内部调用 Vite 的 createServer，自动注入 minix 插件与 Vue Vapor 默认配置。
 * 传入 launcher:true 时，dev server 就绪后会拉起原生 webview 窗口。
 */
export async function dev(options: DevOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const mpRoot = resolveMpRoot(options.root, cwd);
  const port = options.port ?? DEFAULT_PORT;

  console.log(`[minix] 小程序源码目录: ${mpRoot}`);

  const config = createMinixViteConfig(
    cwd,
    mpRoot,
    {
      server: {
        port,
        host: options.host,
        open: options.open,
      },
    },
    options.launcher ? { launcher: { device: options.device } } : {},
  );

  const server = await createServer(config);
  await server.listen();
  server.printUrls();

  // 监听退出信号，确保 dev server 干净退出
  const close = () => {
    void server.close().then(() => process.exit(0));
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);
}
