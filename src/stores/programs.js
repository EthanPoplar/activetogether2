import { defineStore } from "pinia";
import { collection, onSnapshot, orderBy, query, setDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { programs as fallbackPrograms } from "../data/programs";

export const usePrograms = defineStore("programs", {
  state: () => ({
    items: [],
    loading: true,
    error: null,
    unsubscribe: null,
  }),
  actions: {
    async init() {
      if (this.unsubscribe) return;
      try {
        const q = query(collection(db, "programs"), orderBy("name"));
        this.unsubscribe = onSnapshot(q, (snap) => {
          this.items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          this.loading = false;
        }, (err) => {
          console.error(err);
          this.error = err;
          this.loading = false;
          // fall back to bundled sample data so UI still works offline
          if (!this.items.length) {
            this.items = fallbackPrograms;
          }
        });
      } catch (err) {
        this.error = err;
        this.loading = false;
        if (!this.items.length) {
          this.items = fallbackPrograms;
        }
      }
    },
    async seedDefaults() {
      await Promise.all(fallbackPrograms.map(async (program) => {
        await setDoc(doc(db, "programs", program.id), {
          ...program,
          createdAt: program.createdAt || new Date().toISOString(),
        });
      }));
    },
  },
});
