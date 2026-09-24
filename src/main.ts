import { createSSRApp } from "vue";
import uviewPlus from "uview-plus";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import App from "./App.vue";
import "@/styles/tailwind.css";

export function createApp() {
  const app = createSSRApp(App);

  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);

  app.use(pinia);
  app.use(uviewPlus);

  return { app };
}
