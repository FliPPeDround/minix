import type { VaporComponent } from "@vue/runtime-vapor";
import { MinixView, MinixText, MinixIcon, MinixNavigator } from "./basic.ts";
import {
  MinixScrollView,
  MinixSwiper,
  MinixSwiperItem,
  MinixPicker,
  MinixPickerView,
  MinixRich,
  MinixProgress,
} from "./container.ts";
import {
  MinixInput,
  MinixTextarea,
  MinixButton,
  MinixLabel,
  MinixForm,
  MinixCheckbox,
  MinixRadio,
  MinixSlider,
  MinixSwitch,
} from "./form.ts";
import View from "./view/view.ts";
import Text from "./text/text.ts";
import { flushStyles } from "../style.ts";
import Button from "./button/button.ts";
import CheckboxGroup from "./checkbox-group/checkbox-group.ts";
import RadioGroup from "./radio-group/radio-group.ts";
import PickerViewColumn from "./picker-view-column/picker-view-column.ts";
import MovableArea from "./containers/movable-area/movable-area.ts";
import MovableView from "./containers/movable-view/movable-view.ts";
import Canvas from "./canvas/canvas.ts";
import Video from "./video/video.ts";
import Audio from "./audio/audio.ts";
import Map from "./map/map.ts";
import WebView from "./web-view/web-view.ts";
import Editor from "./editor/editor.ts";
import Image from "./image/image.ts";
import MatchMedia from "./containers/match-media/match-media.ts";

// 文件夹式组件默认导出是工厂函数，统一调用一次拿到组件实例，既用于注册
// 表又用于 re-export，避免重复实例化造成两份样式/状态。
const MinixViewFolder = View();
const MinixTextFolder = Text();
const MinixButtonFolder = Button();
const MinixCheckboxGroup = CheckboxGroup();
const MinixRadioGroup = RadioGroup();
const MinixPickerViewColumn = PickerViewColumn();
const MinixMovableArea = MovableArea();
const MinixMovableView = MovableView();
const MinixCanvas = Canvas();
const MinixVideo = Video();
const MinixAudio = Audio();
const MinixMap = Map();
const MinixWebView = WebView();
const MinixEditor = Editor();
const MinixImage = Image();
const MinixMatchMedia = MatchMedia();

/**
 * 内置组件兜底注册表。
 *
 * 这里的组件是 minix 包原有的 .ts 实现，作为迁移期间的兜底。
 * @minix/components 包以 SFC 形式重新实现的同名组件会通过
 * `registerMinixComponent()` 写入 `overrides`，在安装时优先于兜底生效。
 *
 * 迁移某个组件时：
 *   1. 在 @minix/components 中以 SFC 实现并经 install() 注册
 *   2. 从下方 BUILTIN_COMPONENTS 删除对应条目及相关 import
 *   3. 待全部迁移完成后，本文件仅保留注册表 API，不再持有任何实现
 */
const BUILTIN_COMPONENTS: Record<string, VaporComponent> = {
  "minix-view": MinixViewFolder,
  "minix-text": MinixTextFolder,
  "minix-icon": MinixIcon,
  "minix-image": MinixImage,
  "minix-navigator": MinixNavigator,
  "minix-scroll-view": MinixScrollView,
  "minix-swiper": MinixSwiper,
  "minix-swiper-item": MinixSwiperItem,
  "minix-picker": MinixPicker,
  "minix-picker-view": MinixPickerView,
  "minix-rich": MinixRich,
  "minix-progress": MinixProgress,
  "minix-input": MinixInput,
  "minix-textarea": MinixTextarea,
  "minix-button": MinixButtonFolder,
  "minix-label": MinixLabel,
  "minix-form": MinixForm,
  "minix-checkbox": MinixCheckbox,
  "minix-radio": MinixRadio,
  "minix-slider": MinixSlider,
  "minix-switch": MinixSwitch,
  "minix-checkbox-group": MinixCheckboxGroup,
  "minix-radio-group": MinixRadioGroup,
  "minix-picker-view-column": MinixPickerViewColumn,
  "minix-movable-area": MinixMovableArea,
  "minix-movable-view": MinixMovableView,
  "minix-canvas": MinixCanvas,
  "minix-video": MinixVideo,
  "minix-audio": MinixAudio,
  "minix-map": MinixMap,
  "minix-web-view": MinixWebView,
  "minix-editor": MinixEditor,
  "minix-cover-view": MinixView,
  "minix-cover-image": MinixImage,
  "minix-match-media": MinixMatchMedia,
};

/**
 * 外部覆盖注册表。
 *
 * 由 @minix/components 的 install() 调用 `registerMinixComponent()` 写入，
 * 安装时优先级高于 BUILTIN_COMPONENTS，从而支持把 .ts 实现逐个替换为 SFC。
 */
const OVERRIDES: Record<string, VaporComponent> = {};

/**
 * 注册单个 minix-* 内置组件，覆盖同名兜底实现。
 *
 * 供 @minix/components 包在 install() 时调用：
 *
 * ```ts
 * import { registerMinixComponent } from "minix";
 * import View from "./view/index.vue";
 * registerMinixComponent("minix-view", View);
 * ```
 */
export function registerMinixComponent(name: string, comp: VaporComponent): void {
  OVERRIDES[name] = comp;
}

/**
 * 批量注册 minix-* 内置组件。
 *
 * @param map key 为带 `minix-` 前缀的标签名，value 为对应 Vapor 组件
 */
export function registerMinixComponents(map: Record<string, VaporComponent>): void {
  for (const [name, comp] of Object.entries(map)) {
    OVERRIDES[name] = comp;
  }
}

/** 取当前已注册的全部组件（兜底 + 覆盖），覆盖优先 */
export function getMinixComponents(): Record<string, VaporComponent> {
  return { ...BUILTIN_COMPONENTS, ...OVERRIDES };
}

/**
 * 在 createVaporApp 返回的 app 上批量注册全部 minix-* 内置组件。
 *
 * 由 page.ts 在每个页面 mount 时调用：vapor app 是 per-page 的，所以
 * 每个页面都需要注册一次内置组件，让 compiler 产出的 `<minix-*>` 能解析。
 * 覆盖优先级：@minix/components 注册的 > runtime 内置兜底。
 */
export function installMinixComponents(app: { component(name: string, comp: any): unknown }): void {
  flushStyles("minix:components");
  for (const [name, comp] of Object.entries(getMinixComponents())) {
    app.component(name, comp);
  }
}

// re-export 单个组件，方便单测按需 import。
// 迁移期间这些导出来自 .ts 兜底实现；SFC 版本由 @minix/components 直接导出。
export {
  MinixView,
  MinixText,
  MinixIcon,
  MinixImage,
  MinixNavigator,
  MinixScrollView,
  MinixSwiper,
  MinixSwiperItem,
  MinixPicker,
  MinixPickerView,
  MinixRich,
  MinixProgress,
  MinixInput,
  MinixTextarea,
  MinixButton,
  MinixLabel,
  MinixForm,
  MinixCheckbox,
  MinixRadio,
  MinixSlider,
  MinixSwitch,
  MinixCheckboxGroup,
  MinixRadioGroup,
  MinixPickerViewColumn,
  MinixMovableArea,
  MinixMovableView,
  MinixCanvas,
  MinixVideo,
  MinixAudio,
  MinixMap,
  MinixWebView,
  MinixEditor,
};

export { getCanvasById } from "./canvas/canvas.ts";
