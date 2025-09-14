import { defineStore } from "pinia";

const USERS_KEY = "auth:users";
const USER_KEY = "auth:user";
const ROLE_KEY = "role"; // kept for router guard backward compatibility

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function randomSalt(len = 16) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export const useAuth = defineStore("auth", {
  state: () => ({
    isAuthed: !!localStorage.getItem(USER_KEY),
    role: localStorage.getItem(ROLE_KEY) || "guest", // "participant" | "coach" | "admin"
    user: JSON.parse(localStorage.getItem(USER_KEY) || "null"),
    users: JSON.parse(localStorage.getItem(USERS_KEY) || "[]"), // [{ email, role, salt, hash }]
    error: null,
  }),
  actions: {
    persistUsers() { localStorage.setItem(USERS_KEY, JSON.stringify(this.users)); },
    async register({ email, password, role }) {
      email = String(email || "").toLowerCase().trim();
      if (this.users.find(u => u.email === email)) {
        throw new Error("Email already registered");
      }
      const salt = randomSalt();
      const hash = await sha256Hex(salt + ":" + password);
      const userRec = { email, role, salt, hash };
      this.users.push(userRec);
      this.persistUsers();
      // auto-login after register
      this.isAuthed = true; this.role = role; this.user = { email, role };
      localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      localStorage.setItem(ROLE_KEY, role);
    },
    async login({ email, password }) {
      this.error = null;
      email = String(email || "").toLowerCase().trim();
      const userRec = this.users.find(u => u.email === email);
      if (!userRec) { this.error = "Invalid credentials"; throw new Error("Invalid credentials"); }
      const hash = await sha256Hex(userRec.salt + ":" + password);
      if (hash !== userRec.hash) { this.error = "Invalid credentials"; throw new Error("Invalid credentials"); }
      this.isAuthed = true; this.role = userRec.role; this.user = { email, role: userRec.role };
      localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      localStorage.setItem(ROLE_KEY, userRec.role);
    },
    logout() {
      this.isAuthed = false; this.role = "guest"; this.user = null;
      localStorage.removeItem(USER_KEY); localStorage.setItem(ROLE_KEY, "guest");
    },
  },
});
