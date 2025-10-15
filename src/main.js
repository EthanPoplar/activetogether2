import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import { useAuth } from "./stores/auth";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
useAuth(pinia).init();
app.use(router);
app.mount("#app");
