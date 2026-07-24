export { default as View } from "./components/view/index.vue";
export { default as Test } from "./components/test/index.vue";

import View from "./components/view/index.vue";
import Test from "./components/test/index.vue";

export default {
  view: View,
  test: Test,
} as const;
