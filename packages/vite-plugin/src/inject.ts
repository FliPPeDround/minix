/** 用户 js 里直接调用的小程序全局 API（getApp / getCurrentPages），按需注入 import */
function globalApisOf(code: string): string {
  const names = ["getApp", "getCurrentPages"].filter((name) =>
    new RegExp(`\\b${name}\\b`).test(code),
  );
  return names.length ? `, ${names.join(", ")}` : "";
}

/** 给 app.js 注入：createApp 工厂 + app.json / app.wxss，并让 `App` 指向工厂产物 */
export function injectAppImports(code: string, options: { hasWxss: boolean }): string {
  const lines = [
    `import { createApp as __minixCreateApp${globalApisOf(code)} } from "minix";`,
    `import __minixAppConfig from "./app.json";`,
  ];
  if (options.hasWxss) lines.push(`import __minixAppWxss from "./app.wxss";`);
  lines.push(
    `const App = __minixCreateApp(__minixAppConfig, { wxss: ${
      options.hasWxss ? "__minixAppWxss" : "undefined"
    } });`,
    "",
    code,
  );
  return lines.join("\n");
}

/** 给页面 js 注入：createPage 工厂 + wxml render / 页面 json / 页面 wxss */
export function injectPageImports(
  code: string,
  options: { route: string; basename: string; hasJson: boolean; hasWxss: boolean },
): string {
  const lines = [
    `import { createPage as __minixCreatePage${globalApisOf(code)} } from "minix";`,
    `import { render as __minixRender } from "./${options.basename}.wxml";`,
  ];
  if (options.hasJson) {
    lines.push(`import __minixPageConfig from "./${options.basename}.json";`);
  }
  if (options.hasWxss) {
    lines.push(`import __minixPageWxss from "./${options.basename}.wxss";`);
  }
  lines.push(
    `const Page = __minixCreatePage(${JSON.stringify(options.route)}, { render: __minixRender, config: ${
      options.hasJson ? "__minixPageConfig" : "{}"
    }, wxss: ${options.hasWxss ? "__minixPageWxss" : "undefined"} });`,
    "",
    code,
  );
  return lines.join("\n");
}
