import { expect, test } from "vite-plus/test";
import { compile } from "./index.ts";

test("compile", () => {
  const ast = compile("<view>{{msg}}</view>");
  expect(ast).toMatchInlineSnapshot(`
    "import { toDisplayString as _toDisplayString, setText as _setText, renderEffect as _renderEffect, createAssetComponent as _createAssetComponent, template as _template } from 'minix';
    const t0 = _template(" ")

    export function render(_ctx, $props, $emit, $attrs, $slots) {
      const n1 = _createAssetComponent("minix-view", null, () => {
        const n0 = t0()
        _renderEffect(() => _setText(n0, _toDisplayString(_ctx.msg)))
        return n0
      }, true)
      return n1
    }"
  `);
});
