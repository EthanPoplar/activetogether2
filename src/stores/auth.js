import { defineStore } from "pinia";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const ROLE_KEY = "role";

async function loadUserRole(uid) {
  if (!uid) return "guest";
  const snap = await getDoc(doc(db, "userProfiles", uid));
  return snap.exists() ? snap.data().role || "participant" : "participant";
}

export const useAuth = defineStore("auth", {
  state: () => ({
    isAuthed: !!auth.currentUser,
    role: localStorage.getItem(ROLE_KEY) || "guest",
    user: auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email } : null,
    loading: true,
    error: null,
    ready: false,
  }),
  actions: {
    async init() {
      if (this.ready) return;
      if (this.initPromise) return this.initPromise;
      this.initPromise = new Promise((resolve) => {
        this.unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!firebaseUser) {
            this.isAuthed = false;
            this.user = null;
            this.role = "guest";
            localStorage.setItem(ROLE_KEY, "guest");
            this.loading = false;
            this.ready = true;
            resolve();
            return;
          }
          this.isAuthed = true;
          this.user = { uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName };
          this.role = await loadUserRole(firebaseUser.uid);
          localStorage.setItem(ROLE_KEY, this.role);
          this.loading = false;
          this.ready = true;
          resolve();
        });
      });
      return this.initPromise;
    },
    async register({ email, password, role, displayName }) {
      this.error = null;
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      await setDoc(doc(db, "userProfiles", cred.user.uid), {
        email: cred.user.email,
        role: role || "participant",
        createdAt: new Date().toISOString(),
      });
      this.role = role || "participant";
      this.user = { uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName };
      this.isAuthed = true;
      localStorage.setItem(ROLE_KEY, this.role);
      this.ready = true;
      this.loading = false;
    },
    async login({ email, password }) {
      this.error = null;
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        this.role = await loadUserRole(cred.user.uid);
        this.user = { uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName };
        this.isAuthed = true;
        localStorage.setItem(ROLE_KEY, this.role);
        this.ready = true;
        this.loading = false;
      } catch (err) {
        this.error = err.message;
        throw err;
      }
    },
    async logout() {
      await signOut(auth);
      this.isAuthed = false;
      this.role = "guest";
      this.user = null;
      localStorage.setItem(ROLE_KEY, "guest");
      this.ready = true;
      this.loading = false;
    },
  },
});
