<script setup>
import { ref, computed } from "vue";
import { programs } from "../data/programs";
import ProgramCard from "../components/ProgramCard.vue";

const q = ref("");
const onlyFree = ref(false);
const accessible = ref(false);

const results = computed(() =>
  programs.filter(p =>
    (!onlyFree.value || p.cost === 0) &&
    (!accessible.value || p.accessible) &&
    (p.name.toLowerCase().includes(q.value.toLowerCase()) ||
     p.venue.toLowerCase().includes(q.value.toLowerCase()))
  )
);
</script>

<template>
  <section class="container-std py-8">
    <header class="mb-6">
      <h1 class="text-2xl font-bold">Programs</h1>
      <p class="mt-1 text-slate-600">Use the filters to quickly find a good fit.</p>
    </header>

    <div class="grid gap-6 lg:grid-cols-12">
      <aside class="card p-4 lg:col-span-3">
        <h2 class="mb-3 text-sm font-semibold text-slate-900">Filters</h2>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-slate-500">Search</span>
          <input v-model="q" class="input" placeholder="Sport, venue or suburb" />
        </label>
        <div class="mt-3 space-y-2 text-sm">
          <label class="flex items-center gap-2"><input type="checkbox" v-model="onlyFree" /> Free only</label>
          <label class="flex items-center gap-2"><input type="checkbox" v-model="accessible" /> Wheelchair accessible</label>
        </div>
        <div class="mt-4 flex gap-2">
          <button class="btn-primary" @click="()=>{}">Apply</button>
          <button class="btn-ghost" @click="q='';onlyFree=false;accessible=false">Reset</button>
        </div>
      </aside>

      <section class="lg:col-span-9">
        <div v-if="results.length" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <ProgramCard v-for="p in results" :key="p.id" :program="p" />
        </div>
        <div v-else class="card p-8 text-center">
          <p class="text-lg font-semibold">No matches yet</p>
          <p class="mt-1 text-slate-600">Try clearing filters or searching a different suburb.</p>
          <button class="btn-ghost mt-4" @click="q='';onlyFree=false;accessible=false">Clear filters</button>
        </div>
      </section>
    </div>
  </section>
</template>
