import { expect, test } from "vite-plus/test";
import { transformToVue } from "./index.ts";

test("条件渲染: wx:if / wx:elif / wx:else", () => {
  const wxml = '<view wx:if="{{a}}">1</view><view wx:elif="{{b}}">2</view><view wx:else>3</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view v-if="a">1</minix-view><minix-view v-else-if="b">2</minix-view><minix-view v-else="">3</minix-view>"`,
  );
});

test("列表渲染: wx:for + wx:for-item + wx:for-index + wx:key", () => {
  const wxml =
    '<view wx:for="{{list}}" wx:for-item="item" wx:for-index="idx" wx:key="id">{{item.name}}</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view v-for="(item, idx) in list" :key="item.id">{{item.name}}</minix-view>"`,
  );
});

test("列表渲染: 默认 item / index 命名", () => {
  const wxml = '<view wx:for="{{list}}">{{item}}</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view v-for="(item, index) in list">{{item}}</minix-view>"`,
  );
});

test('列表渲染: wx:key="*this" 指向循环项', () => {
  const wxml = '<view wx:for="{{list}}" wx:key="*this">{{item}}</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view v-for="(item, index) in list" :key="item">{{item}}</minix-view>"`,
  );
});

test("事件绑定: bindtap 映射为 @click", () => {
  const wxml = '<view bindtap="onTap">tap</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view @click="onTap">tap</minix-view>"`,
  );
});

test("事件绑定: bind:event 语法", () => {
  const wxml = '<view bind:tap="onTap">tap</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view @click="onTap">tap</minix-view>"`,
  );
});

test("事件绑定: catchtap → @click.stop", () => {
  const wxml = '<view catchtap="onTap">tap</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view @click.stop="onTap">tap</minix-view>"`,
  );
});

test("事件绑定: catch:event 语法", () => {
  const wxml = '<view catch:tap="onTap">tap</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view @click.stop="onTap">tap</minix-view>"`,
  );
});

test("事件绑定: capture-bind: → .capture 修饰符", () => {
  const wxml = '<view capture-bind:touchstart="onTs">ts</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view @touchstart.capture="onTs">ts</minix-view>"`,
  );
});

test("事件绑定: capture-catch: → .capture.stop 修饰符", () => {
  const wxml = '<view capture-catch:touchstart="onTs">ts</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view @touchstart.capture.stop="onTs">ts</minix-view>"`,
  );
});

test("事件绑定: mut-bind → 无修饰符", () => {
  const wxml = '<view mut-bindinput="onInput">input</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view @input="onInput">input</minix-view>"`,
  );
});

test("事件绑定: mut-bind: 语法", () => {
  const wxml = '<view mut-bind:input="onInput">input</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view @input="onInput">input</minix-view>"`,
  );
});

test("事件绑定: longtap / longpress 映射", () => {
  const wxml = '<view bindlongtap="onLongTap" bindlongpress="onLongPress">long</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view @longpress="onLongPress">long</minix-view>"`,
  );
});

test("事件绑定: 未映射的事件名原样保留", () => {
  const wxml = '<view bindtouchmove="onMove">move</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view @touchmove="onMove">move</minix-view>"`,
  );
});

test("属性绑定: 纯 mustache 转 v-bind", () => {
  const wxml = '<view src="{{url}}" data-id="{{item.id}}">x</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view :src="url" :data-id="item.id">x</minix-view>"`,
  );
});

test("属性绑定: 非纯 mustache 保持原样", () => {
  const wxml = '<view class="card {{active}}" src="prefix-{{id}}">x</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view class="card {{active}}" src="prefix-{{id}}">x</minix-view>"`,
  );
});

test("普通属性保持不变", () => {
  const wxml = '<view class="card" style="color: red">x</view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view class="card" style="color: red">x</minix-view>"`,
  );
});

test("文本中的 mustache 保持不变", () => {
  const wxml = "<view>hello {{name}}, age is {{age}}</view>";
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view>hello {{name}}, age is {{age}}</minix-view>"`,
  );
});

test("组合场景", () => {
  const wxml =
    '<view wx:if="{{show}}" class="card {{cls}}" src="{{url}}" bindtap="onClick" catch:touchstart="onTs"><text>{{title}}</text></view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view v-if="show" class="card {{cls}}" :src="url" @click="onClick" @touchstart.stop="onTs"><minix-text>{{title}}</minix-text></minix-view>"`,
  );
});

test("嵌套结构", () => {
  const wxml =
    '<view wx:for="{{list}}" wx:key="id"><view wx:if="{{item.show}}" bindtap="onTap">{{item.name}}</view></view>';
  expect(transformToVue(wxml)).toMatchInlineSnapshot(
    `"<minix-view v-for="(item, index) in list" :key="item.id"><minix-view v-if="item.show" @click="onTap">{{item.name}}</minix-view></minix-view>"`,
  );
});
