import { computed, reactive } from "vue";
import { defineStore } from "pinia";

const STORAGE_KEY = "programNotes";

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch (err) {
    console.warn("Failed to parse program notes", err);
    return {};
  }
}

function persist(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export const useSessionNotes = defineStore("sessionNotes", () => {
  const notes = reactive(loadNotes());

  function save(programId, text) {
    if (!programId) return;
    if (!text?.trim()) {
      delete notes[programId];
    } else {
      notes[programId] = text.trim();
    }
    persist(notes);
  }

  function clear(programId) {
    if (!programId) return;
    delete notes[programId];
    persist(notes);
  }

  function load(programId) {
    return notes[programId] || "";
  }

  const totalNotes = computed(() => Object.keys(notes).length);

  return { notes, save, load, clear, totalNotes };
});
