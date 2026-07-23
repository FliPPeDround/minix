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
 * 内置组件注册表。
 *
 * key 是 WXML 侧加 `minix-` 前缀后的标签名，与 compiler/transforms 产出的
 * 标签一致；value 是对应的 Vue 组件。createVaporApp 后调用
 * `registerMinixComponents(app)` 即可全局注册，所有页面都能直接用
 * `<minix-view>` 等标签而无需逐个 import。
 */
export const MINIX_COMPONENTS: Record<string, VaporComponent> = {
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

/** 在 createVaporApp 返回的 app 上批量注册全部 minix-* 内置组件 */
export function registerMinixComponents(app: {
  component(name: string, comp: any): unknown;
}): void {
  flushStyles("minix:components");
  for (const [name, comp] of Object.entries(MINIX_COMPONENTS)) {
    app.component(name, comp);
  }
}

// re-export 单个组件，方便单测按需 import
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
