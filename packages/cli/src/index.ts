#!/usr/bin/env node
import { cac } from "cac";
import { dev, type DevOptions } from "./commands/dev.ts";
import { buildApp, type BuildOptions } from "./commands/build.ts";

const cli = cac("minix");

cli
  .command("dev", "在浏览器中启动小程序进行开发")
  .option("--root <dir>", "小程序源码目录（默认自动探测）")
  .option("-p, --port <port>", "端口号", { default: 5173 })
  .option("--host <host>", "主机名")
  .option("-o, --open", "启动后自动打开浏览器", { default: false })
  .action((options: DevOptions) => dev(options));

cli
  .command("build", "构建小程序为静态网站")
  .option("--root <dir>", "小程序源码目录（默认自动探测）")
  .option("--out <dir>", "输出目录", { default: "dist" })
  .option("--sourcemap", "生成 sourcemap", { default: false })
  .action((options: BuildOptions) => buildApp(options));

cli.help();
cli.version("0.0.0");
cli.parse();
