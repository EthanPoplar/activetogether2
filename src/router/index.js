import { createRouter, createWebHistory } from "vue-router";

// Views
import Home from "../views/Home.vue";
import Programs from "../views/Programs.vue";
import ProgramDetail from "../views/ProgramDetail.vue";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Dashboard from "../views/Dashboard.vue";
import NotFound from "../views/NotFound.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/programs", component: Programs },
  { path: "/programs/:id", component: ProgramDetail },
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/dashboard", component: Dashboard },
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

const router = createRouter({
  // Use Vite's base URL so routes work under subpaths
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
