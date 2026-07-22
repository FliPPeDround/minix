import type { VaporComponent } from "@vue/runtime-vapor";
import { MinixView, MinixText, MinixIcon, MinixImage, MinixNavigator } from "./basic.ts";
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
/**
 * 内置组件注册表。
 *
 * key 是 WXML 侧加 `minix-` 前缀后的标签名，与 compiler/transforms 产出的
 * 标签一致；value 是对应的 Vue 组件。createVaporApp 后调用
 * `registerMinixComponents(app)` 即可全局注册，所有页面都能直接用
 * `<minix-view>` 等标签而无需逐个 import。
 */
export const MINIX_COMPONENTS: Record<string, VaporComponent> = {
  "minix-view": View(),
  "minix-text": Text(),
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
  "minix-button": Button(),
  "minix-label": MinixLabel,
  "minix-form": MinixForm,
  "minix-checkbox": MinixCheckbox,
  "minix-radio": MinixRadio,
  "minix-slider": MinixSlider,
  "minix-switch": MinixSwitch,
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
};
