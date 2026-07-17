import postcss, { type PluginCreator } from "postcss";
// 该包是 CJS（module.exports = fn + exports.default = fn），在 moduleResolution:
// nodenext 下默认 import 的类型推断有歧义，改用 namespace import 取 .default，
// 并断言为 postcss 的 PluginCreator 以恢复可调用类型
import * as pxtoviewportNS from "postcss-px-to-viewport-8-plugin";

const pxtoviewport = pxtoviewportNS.default as unknown as PluginCreator<any>;

/**
 * rpx → vw：微信小程序规定 750rpx 恒等于屏幕宽度，
 * 即 750rpx = 100vw。用 postcss-px-to-viewport-8-plugin 做单位换算，
 * 配置 `unitToConvert: 'rpx'` + `viewportWidth: 750` 即得 1rpx ≈ 0.13333vw，
 * 与原手写正则语义一致，输出为预计算的 vw 值（无运行时 calc）。
 *
 * 复用成熟 postcss 插件而非手写正则，可随插件升级获得更健壮的解析
 * （媒体查询、选择器、嵌套等边界情况由 postcss 解析器保证）。
 */
const rpxProcessor = postcss([
  pxtoviewport({
    unitToConvert: "rpx",
    viewportWidth: 750,
    viewportUnit: "vw",
    fontViewportUnit: "vw",
    unitPrecision: 5,
    propList: ["*"],
    minPixelValue: 0,
    replace: true,
    mediaQuery: false,
  }),
]);

export function transformRpx(css: string): string {
  return rpxProcessor.process(css, { from: undefined }).css;
}
