import { defineStore } from "pinia";

export const useAuth = defineStore("auth", {
  state: () => ({
    isAuthed: !!localStorage.getItem("user"),
    role: localStorage.getItem("role") || "guest", // "participant" | "coach" | "admin"
    user: JSON.parse(localStorage.getItem("user") || "null"),
  }),
  actions: {
    login({ email, role }) {
      this.isAuthed = true; this.role = role; this.user = { email };
      localStorage.setItem("user", JSON.stringify(this.user));
      localStorage.setItem("role", role);
    },
    logout() {
      this.isAuthed = false; this.role = "guest"; this.user = null;
      localStorage.removeItem("user"); localStorage.removeItem("role");
    },
  },
});

