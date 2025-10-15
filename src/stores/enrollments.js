import { defineStore } from "pinia";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./auth";

export const useEnrollments = defineStore("enrollments", {
  state: () => ({
    records: [],
    loading: true,
    error: null,
    unsubscribe: null,
  }),
  getters: {
    forProgram: (state) => (programId) => state.records.filter(r => r.programId === programId),
  },
  actions: {
    async init({ onlyMine = false } = {}) {
      if (this.unsubscribe) return;
      const auth = useAuth();
      await auth.init();
      try {
        const constraints = [orderBy("createdAt", "desc")];
        if (onlyMine && auth.user) {
          constraints.push(where("userId", "==", auth.user.uid));
        }
        const q = query(collection(db, "enrollments"), ...constraints);
        this.unsubscribe = onSnapshot(q, (snap) => {
          this.records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          this.loading = false;
        }, (err) => {
          this.error = err;
          this.loading = false;
        });
      } catch (err) {
        this.error = err;
        this.loading = false;
      }
    },
    async add({ programId, programName, participantName, email, notes }) {
      const auth = useAuth();
      await auth.init();
      try {
        await addDoc(collection(db, "enrollments"), {
          programId,
          programName,
          participantName,
          email,
          notes: notes || "",
          userId: auth.user?.uid || null,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        this.error = err;
        throw err;
      }
    },
  },
});
