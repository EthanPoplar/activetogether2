import { defineStore } from "pinia";

const STORAGE_KEY = "favorites:programs";

function loadIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Failed to parse favorites", err);
    return [];
  }
}

function persist(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export const useFavorites = defineStore("favorites", {
  state: () => ({
    ids: loadIds(),
  }),
  getters: {
    isFavorite: (state) => (id) => state.ids.includes(id),
    items(state) {
      return state.ids;
    },
  },
  actions: {
    toggle(id) {
      const exists = this.ids.includes(id);
      if (exists) {
        this.ids = this.ids.filter((fav) => fav !== id);
      } else {
        this.ids = [...this.ids, id];
      }
      persist(this.ids);
    },
    set(ids) {
      this.ids = Array.isArray(ids) ? [...new Set(ids)] : [];
      persist(this.ids);
    },
  },
});
