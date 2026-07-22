import { createVaporApp } from "vue";
import App from "./App.vue";

// @ts-expect-error
createVaporApp(App).mount("#app");
