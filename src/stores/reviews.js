import { defineStore } from "pinia";
import DOMPurify from "dompurify";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export const useReviews = defineStore("reviews", {
  state: () => ({
    byProgram: {},
    listeners: {},
    loading: {},
    error: {},
  }),
  getters: {
    forProgram: (state) => (id) => state.byProgram[id] || [],
    isLoading: (state) => (id) => !!state.loading[id],
  },
  actions: {
    watch(programId) {
      if (this.listeners[programId]) return;
      this.loading[programId] = true;
      const q = query(
        collection(db, "programs", programId, "reviews"),
        orderBy("createdAt", "desc")
      );
      this.listeners[programId] = onSnapshot(
        q,
        (snap) => {
          this.byProgram[programId] = snap.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() ?? data.createdAt ?? null,
            };
          });
          this.loading[programId] = false;
        },
        (err) => {
          console.error(err);
          this.error[programId] = err;
          this.loading[programId] = false;
        }
      );
    },
    stop(programId) {
      if (this.listeners[programId]) {
        this.listeners[programId]();
        delete this.listeners[programId];
      }
    },
    async add(programId, review) {
      const clean = {
        user: String(review.user || "anon").slice(0, 60),
        rating: Math.min(5, Math.max(1, Number(review.rating) || 1)),
        text: DOMPurify.sanitize(String(review.text || "").slice(0, 1000), {
          ALLOWED_ATTR: [],
          ALLOWED_TAGS: ["b", "i", "strong", "em", "u", "a", "br", "p"],
        }),
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "programs", programId, "reviews"), clean);
      return clean;
    },
  },
});
