import { expect, test } from "vite-plus/test";
import { transformToVue } from "./index.ts";

test("block 标签映射为 template", () => {
  const wxml = '<block wx:if="{{ok}}"><view>1</view></block><block>plain</block>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<template v-if="ok"><minix-view>1</minix-view></template><template>plain</template>"`,
  );
});

test("block + wx:for 组合", () => {
  const wxml = '<block wx:for="{{list}}" wx:key="*this"><view>{{item}}</view></block>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<template v-for="(item, index) in list" :key="item"><minix-view>{{item}}</minix-view></template>"`,
  );
});
