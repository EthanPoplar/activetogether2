import { defineStore } from "pinia";
import DOMPurify from "dompurify";

const REVIEWS_KEY = "reviews:data"; // { [programId]: Review[] }

export const useReviews = defineStore("reviews", {
  state: () => ({
    byProgram: JSON.parse(localStorage.getItem(REVIEWS_KEY) || "{}"),
  }),
  getters: {
    forProgram: (state) => (id) => state.byProgram[id] || [],
  },
  actions: {
    persist() { localStorage.setItem(REVIEWS_KEY, JSON.stringify(this.byProgram)); },
    add(id, review) {
      const clean = {
        user: String(review.user || "anon").slice(0, 40),
        rating: Math.min(5, Math.max(1, Number(review.rating) || 1)),
        text: DOMPurify.sanitize(String(review.text || "").slice(0, 1000), { ALLOWED_ATTR: [], ALLOWED_TAGS: ["b","i","strong","em","u","a","br","p"] }),
        createdAt: new Date().toISOString(),
      };
      if (!this.byProgram[id]) this.byProgram[id] = [];
      this.byProgram[id].push(clean);
      this.persist();
      return clean;
    },
  },
});

