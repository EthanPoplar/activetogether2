<script setup>
import { computed, onMounted, ref, watch } from "vue";
import ProgramCard from "../components/ProgramCard.vue";
import VenueMap from "../components/VenueMap.vue";
import { usePrograms } from "../stores/programs";
import { useFavorites } from "../stores/favorites";

const programsStore = usePrograms();
const favoritesStore = useFavorites();
const q = ref("");
const onlyFree = ref(false);
const accessible = ref(false);
const selectedProgramId = ref("");
const userLocation = ref(null);
const locating = ref(false);

const results = computed(() =>
  programsStore.items.filter(p =>
    (!onlyFree.value || p.cost === 0) &&
    (!accessible.value || p.accessible) &&
    (p.name.toLowerCase().includes(q.value.toLowerCase()) ||
     p.venue.toLowerCase().includes(q.value.toLowerCase()))
  )
);

const markers = computed(() => results.value.map(program => ({
  id: program.id,
  label: program.name,
  lat: program.location?.lat,
  lng: program.location?.lng,
  address: program.location?.address,
})).filter(marker => marker.lat && marker.lng));

const mapCenter = computed(() => {
  const selected = programsStore.items.find(p => p.id === selectedProgramId.value);
  return selected?.location || markers.value[0] || { lat: -37.7999, lng: 144.93 };
});

const nearbyPrograms = computed(() => {
  if (!userLocation.value) return [];
  return programsStore.items
    .map(program => ({
      program,
      distance: haversine(userLocation.value, program.location),
    }))
    .filter(entry => Number.isFinite(entry.distance))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);
});

const route = computed(() => {
  if (!userLocation.value) return null;
  const selected = programsStore.items.find(p => p.id === selectedProgramId.value);
  if (!selected?.location) return null;
  return { from: userLocation.value, to: selected.location };
});

const favoritePrograms = computed(() =>
  favoritesStore.items
    .map(id => programsStore.items.find(p => p.id === id))
    .filter(Boolean)
);

function haversine(from, to) {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return Infinity;
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(1);
}

function selectProgram(id) {
  selectedProgramId.value = id;
}

function resetFilters() {
  q.value = "";
  onlyFree.value = false;
  accessible.value = false;
}

function toggleFavorite(id) {
  favoritesStore.toggle(id);
}

function locateMe() {
  if (!navigator.geolocation) return;
  locating.value = true;
  navigator.geolocation.getCurrentPosition((position) => {
    userLocation.value = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    locating.value = false;
  }, () => {
    locating.value = false;
  }, { enableHighAccuracy: true });
}

onMounted(() => {
  programsStore.init();
});

watch(results, (list) => {
  if (list.length && !selectedProgramId.value) {
    selectedProgramId.value = list[0].id;
  }
});
</script>

<template>
  <section class="container-std py-8 space-y-6">
    <header class="mb-6">
      <h1 class="text-2xl font-bold">Programs</h1>
      <p class="mt-1 text-slate-600">Use filters, the interactive map, or the “near me” tool to find activities quickly.</p>
    </header>

    <div class="grid gap-6 lg:grid-cols-12">
      <aside class="card p-4 lg:col-span-3 space-y-4" aria-label="Filters">
        <form class="space-y-4" @submit.prevent>
          <fieldset class="space-y-3">
            <legend class="mb-1 text-sm font-semibold text-slate-900">Filters</legend>
            <label class="block" for="program-search">
              <span class="mb-1 block text-xs font-medium text-slate-500">Search</span>
              <input
                id="program-search"
                v-model="q"
                class="input"
                type="search"
                placeholder="Sport, venue or suburb"
                aria-describedby="program-search-help"
              />
            </label>
            <p id="program-search-help" class="text-xs text-slate-500">Type to filter by program name or venue.</p>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <input id="filter-free" type="checkbox" v-model="onlyFree" />
                <label for="filter-free">Free only</label>
              </div>
              <div class="flex items-center gap-2">
                <input id="filter-accessible" type="checkbox" v-model="accessible" />
                <label for="filter-accessible">Wheelchair accessible</label>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="btn-ghost" type="reset" @click.prevent="resetFilters">Reset</button>
            </div>
          </fieldset>

          <fieldset class="border-t border-slate-200 pt-4 space-y-3">
            <legend class="text-sm font-semibold text-slate-900">Find near me</legend>
            <p class="text-xs text-slate-500" id="nearby-desc">We’ll use your current location to highlight close-by programs.</p>
            <button
              class="btn-primary mt-1 w-full"
              type="button"
              :disabled="locating"
              aria-describedby="nearby-desc"
              @click="locateMe"
            >
              <span v-if="!locating">Locate me</span>
              <span v-else>Locating…</span>
            </button>
            <ul v-if="nearbyPrograms.length" class="space-y-2 text-sm" aria-live="polite">
              <li v-for="{ program, distance } in nearbyPrograms" :key="program.id">
                <button class="underline" type="button" @click="selectProgram(program.id)">
                  {{ program.name }}
                </button>
                <span class="text-xs text-slate-500"> · {{ distance }} km away</span>
              </li>
            </ul>
            <p v-else-if="userLocation" class="text-xs text-slate-500" role="status" aria-live="polite">
              No nearby programs within 10 km yet.
            </p>
          </fieldset>

          <section v-if="favoritePrograms.length" aria-label="Saved programs" class="rounded-xl bg-slate-50 p-3 text-sm">
            <h3 class="font-semibold text-slate-900">Saved for later</h3>
            <p class="mt-1 text-xs text-slate-500">Quick access to starred programs.</p>
            <ul class="mt-2 space-y-1">
              <li v-for="program in favoritePrograms" :key="program.id">
                <button class="underline" type="button" @click="selectProgram(program.id)">
                  {{ program.name }}
                </button>
              </li>
            </ul>
            <button class="btn-ghost mt-3 w-full" type="button" @click="favoritesStore.set([])">
              Clear saved programs
            </button>
          </section>
        </form>
      </aside>

      <section class="lg:col-span-9 space-y-6">
        <div class="card p-4">
          <h2 class="text-sm font-semibold text-slate-900">Interactive map</h2>
          <p class="text-xs text-slate-500">Hover markers to preview venues. When “near me” is active we draw a route to the selected program.</p>
          <VenueMap
            class="mt-3"
            :center="mapCenter"
            :markers="markers"
            :highlight-id="selectedProgramId"
            :route="route"
          />
        </div>

        <p class="text-sm text-slate-600" role="status" aria-live="polite">{{ results.length }} program{{ results.length === 1 ? '' : 's' }} found</p>

        <div v-if="results.length" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">
          <ProgramCard
            v-for="p in results"
            :key="p.id"
            :program="p"
            :favorite="favoritesStore.isFavorite(p.id)"
            @mouseenter="selectProgram(p.id)"
            @focusin="selectProgram(p.id)"
            @toggle-favorite="toggleFavorite"
          />
        </div>
        <div v-else class="card p-8 text-center" role="status">
          <p class="text-lg font-semibold">No matches yet</p>
          <p class="mt-1 text-slate-600">Try clearing filters or searching a different suburb.</p>
          <button class="btn-ghost mt-4" type="button" @click="resetFilters">Clear filters</button>
        </div>
      </section>
    </div>
  </section>
</template>
