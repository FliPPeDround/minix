# minix 内置组件

本目录是 `minix` 包对接 `@minix/compiler` 产出的 `<minix-*>` 自定义元素标签的内置组件实现。
WXML 侧的内置标签（如 `view` / `text` / `image`）在编译期会被 compiler/transforms 统一加上 `minix-` 前缀，
再由本目录的 Vue Vapor 组件在浏览器侧渲染对应的 HTML 元素并实现小程序语义（事件签名、默认样式、特殊属性）。

## 实现模式

简单包裹类组件（view / text / button / ...）采用**独立文件夹模式**：

```
components/<name>/
  ├── <name>.ts     # 主组件：import CSS → pushStyle → defineVaporComponent 工厂函数
  ├── <name>.css    # 默认样式（通过 ?inline 内联为字符串后累积注入）
  └── props.ts      # 可选：组件 props 声明（button / movable-view / video 等需要）
```

每个 `.ts` 默认导出一个**工厂函数** `() => VaporComponent`，在 [components/index.ts](./index.ts) 中调用一次实例化，
既用于 `MINIX_COMPONENTS` 注册表，也用于 `registerMinixComponents(app)` 批量全局注册。

复杂但相对集中、且互相复用 helper 的组件（icon / image / navigator / scroll-view / swiper / picker / rich / progress / input / textarea / label / form / checkbox / radio / slider / switch）暂仍以**扁平单文件**形式维护：

- [basic.ts](./basic.ts)：view / text / icon / image / navigator
- [container.ts](./container.ts)：scroll-view / swiper / swiper-item / picker / picker-view / rich / progress
- [form.ts](./form.ts)：input / textarea / button / label / form / checkbox / radio / slider / switch

后续若需扩展 props 或样式，可按需将其中任何一个迁移到独立文件夹，无需改动对外接口。

## 已实现组件清单

### 基础内容

| WXML 标签   | minix 标签       | 文件 / 导出                                    | 关键 props / 事件                                                          |
| ----------- | ---------------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| `view`      | `minix-view`     | [view/view.ts](./view/view.ts)                 | -                                                                          |
| `text`      | `minix-text`     | [text/text.ts](./text/text.ts)                 | -                                                                          |
| `icon`      | `minix-icon`     | [basic.ts](./basic.ts) `MinixIcon`             | `type` / `size` / `color`                                                  |
| `image`     | `minix-image`    | [basic.ts](./basic.ts) `MinixImage`            | `src` / `mode` / `lazyLoad`                                                |
| `progress`  | `minix-progress` | [container.ts](./container.ts) `MinixProgress` | `percent` / `showInfo` / `strokeWidth` / `activeColor` / `backgroundColor` |
| `rich-text` | `minix-rich`     | [container.ts](./container.ts) `MinixRich`     | `nodes`（HTML 字符串）                                                     |

### 容器 / 滚动

| WXML 标签      | minix 标签           | 文件 / 导出                                                                      | 关键 props / 事件                                                                                                                         |
| -------------- | -------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `scroll-view`  | `minix-scroll-view`  | [container.ts](./container.ts) `MinixScrollView`                                 | `scrollX/Y` / `upperThreshold` / `lowerThreshold` / `scrollTop` / `scrollIntoView`；bindscroll / scrolltoupper / scrolltolower            |
| `swiper`       | `minix-swiper`       | [container.ts](./container.ts) `MinixSwiper`                                     | `current` / `autoplay` / `interval` / `duration` / `circular` / `vertical`（自动播放动画暂未实现）                                        |
| `swiper-item`  | `minix-swiper-item`  | [container.ts](./container.ts) `MinixSwiperItem`                                 | -                                                                                                                                         |
| `movable-area` | `minix-movable-area` | [movable-area/movable-area.ts](./movable-area/movable-area.ts)                   | -                                                                                                                                         |
| `movable-view` | `minix-movable-view` | [movable-view/movable-view.ts](./movable-view/movable-view.ts)                   | `direction` / `inertia` / `outOfBounds` / `x` / `y` / `damping` / `friction` / `disabled` / `scale` / `scaleMin/Max`；bindchange / scale  |
| `cover-view`   | `minix-cover-view`   | [cover-view/cover-view.ts](./cover-view/cover-view.ts)                           | -                                                                                                                                         |
| `cover-image`  | `minix-cover-image`  | [cover-image/cover-image.ts](./cover-image/cover-image.ts)                       | `src`                                                                                                                                     |
| `match-media`  | `minix-match-media`  | [containers/match-media/match-media.ts](./containers/match-media/match-media.ts) | `min-width` / `max-width` / `width` / `min-height` / `max-height` / `height` / `orientation`；视口满足全部 media query 规则时才展示子节点 |

### 表单

| WXML 标签            | minix 标签                 | 文件 / 导出                                                                            | 关键 props / 事件                                                                                                                      |
| -------------------- | -------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `button`             | `minix-button`             | [button/button.ts](./button/button.ts)                                                 | `size` / `type` / `plain` / `disabled` / `loading` / `formType` / `openType`                                                           |
| `form`               | `minix-form`               | [form.ts](./form.ts) `MinixForm`                                                       | `reportSubmit`；bindsubmit / bindreset                                                                                                 |
| `input`              | `minix-input`              | [form.ts](./form.ts) `MinixInput`                                                      | `value` / `type` / `password` / `placeholder` / `disabled` / `maxlength` / `focus` / `confirmType`；bindinput / focus / blur / confirm |
| `textarea`           | `minix-textarea`           | [form.ts](./form.ts) `MinixTextarea`                                                   | `value` / `placeholder` / `disabled` / `maxlength` / `focus` / `autoHeight`；bindinput                                                 |
| `label`              | `minix-label`              | [form.ts](./form.ts) `MinixLabel`                                                      | -                                                                                                                                      |
| `checkbox`           | `minix-checkbox`           | [form.ts](./form.ts) `MinixCheckbox`                                                   | `value` / `checked` / `disabled` / `color`；bindchange                                                                                 |
| `checkbox-group`     | `minix-checkbox-group`     | [checkbox-group/checkbox-group.ts](./checkbox-group/checkbox-group.ts)                 | -；bindchange（detail.value 为选中值数组）                                                                                             |
| `radio`              | `minix-radio`              | [form.ts](./form.ts) `MinixRadio`                                                      | `value` / `checked` / `disabled` / `color`；bindchange                                                                                 |
| `radio-group`        | `minix-radio-group`        | [radio-group/radio-group.ts](./radio-group/radio-group.ts)                             | -；bindchange（detail.value 为选中值）                                                                                                 |
| `switch`             | `minix-switch`             | [form.ts](./form.ts) `MinixSwitch`                                                     | `checked` / `disabled` / `color`；bindchange                                                                                           |
| `slider`             | `minix-slider`             | [form.ts](./form.ts) `MinixSlider`                                                     | `min` / `max` / `step` / `value` / `showValue` / `activeColor` / `disabled`；bindchanging / change                                     |
| `picker`             | `minix-picker`             | [container.ts](./container.ts) `MinixPicker`                                           | 占位实现，弹窗逻辑后续补                                                                                                               |
| `picker-view`        | `minix-picker-view`        | [container.ts](./container.ts) `MinixPickerView`                                       | 占位实现，滚动联动后续补                                                                                                               |
| `picker-view-column` | `minix-picker-view-column` | [picker-view-column/picker-view-column.ts](./picker-view-column/picker-view-column.ts) | 可滚动列容器，scroll-snap-y 对齐当前项                                                                                                 |
| `editor`             | `minix-editor`             | [editor/editor.ts](./editor/editor.ts)                                                 | `readOnly` / `placeholder`；bindready / focus / blur / input                                                                           |

### 导航

| WXML 标签   | minix 标签        | 文件 / 导出                                    | 关键 props / 事件                                                                                                         |
| ----------- | ----------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `navigator` | `minix-navigator` | [basic.ts](./basic.ts) `MinixNavigator`        | `url` / `openType` / `target` / `delta`；点击调用 `navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack` |
| `web-view`  | `minix-web-view`  | [web-view/web-view.ts](./web-view/web-view.ts) | `src`；bindload / bindmessage（基于 iframe + postMessage）                                                                |

### 媒体

| WXML 标签 | minix 标签     | 文件 / 导出                            | 关键 props / 事件                                                                                                                                                       |
| --------- | -------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `canvas`  | `minix-canvas` | [canvas/canvas.ts](./canvas/canvas.ts) | `type` / `canvasId` / `disableScroll`；bindtouchstart / touchmove；导出 `getCanvasById(id)` 供旧版 `wx.createCanvasContext` 复用                                        |
| `video`   | `minix-video`  | [video/video.ts](./video/video.ts)     | `src` / `poster` / `controls` / `autoplay` / `loop` / `muted` / `initialTime` / `objectFit`；bindplay / pause / ended / timeupdate / waiting / error / fullscreenchange |
| `audio`   | `minix-audio`  | [audio/audio.ts](./audio/audio.ts)     | `src` / `loop` / `autoplay` / `muted`；bindplay / pause / ended / timeupdate / error / canplay（旧版组件，建议改用 `InnerAudioContext`）                                |

### 地图

| WXML 标签 | minix 标签  | 文件 / 导出                | 关键 props / 事件                                                                                                                                                                                                                                               |
| --------- | ----------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `map`     | `minix-map` | [map/map.ts](./map/map.ts) | `longitude` / `latitude` / `scale` / `markers` / `polyline` / `circles` / `polygons` / `showLocation` / `enableZoom/Scroll/Rotate/Overlooking` / `enable3D`；bindtap。**当前用 OpenStreetMap iframe 占位，覆盖物与 regionchange 事件需接入真实地图 SDK 后实现** |

## 未实现的标签

以下小程序内置组件目前**未实现**（标签清单也不在 compiler 的 `MINIX_TAGS` 中）：

- `live-player` / `live-pusher`：直播推流，浏览器侧需对接 RTC SDK，暂不实现
- `ad` / `ad-custom`：广告组件，依赖小程序平台 SDK
- `official-account`：公众号关注组件
- `functional-page-navigator`：跳转到插件功能页
- `open-data`：开放数据展示

如需扩展，参考 [view/view.ts](./view/view.ts) 与 [button/button.ts](./button/button.ts) 的工厂函数模式新增文件夹，
并将新标签加入 [compiler/transforms/index.ts](../../compiler/src/transforms/index.ts) 的 `MINIX_TAGS` 列表，
即可在 WXML 中以原标签名直接使用。
