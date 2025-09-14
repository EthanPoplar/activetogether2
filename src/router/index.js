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
  { path: "/dashboard", component: Dashboard, meta: { requiresAuth: true, roles: ["coach", "admin"] } },
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

const router = createRouter({
  // Use Vite's base URL so routes work under subpaths
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Global auth/role guard
router.beforeEach((to) => {
  if (!to.meta?.requiresAuth) return true;
  const role = localStorage.getItem("role") || "guest";
  const isAuthed = !!localStorage.getItem("user");
  if (!isAuthed) return { path: "/login", query: { redirect: to.fullPath } };
  const allowed = Array.isArray(to.meta.roles) ? to.meta.roles.includes(role) : true;
  if (!allowed) return { path: "/" };
  return true;
});

export default router;
