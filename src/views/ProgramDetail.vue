<script setup>
import { programs, avgRating } from "../data/programs";
import { useRoute } from "vue-router";
const id = useRoute().params.id;
const program = programs.find(p => p.id === id);
</script>

<template>
  <section class="container-std py-8" v-if="program">
    <div class="grid gap-6 lg:grid-cols-3">
      <div class="card lg:col-span-2">
        <div class="h-56 bg-gradient-to-tr from-blue-200 to-cyan-200"></div>
        <div class="p-5">
          <h1 class="text-2xl font-bold">{{ program.name }}</h1>
          <p class="mt-1 text-slate-600">{{ program.venue }} • {{ program.when }}</p>
          <p class="mt-2 text-sm">Average rating: ⭐ <span class="font-medium">{{ avgRating(program).toFixed(1) }}</span></p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span v-for="t in program.tags" :key="t" class="pill">{{ t }}</span>
            <span v-if="program.accessible" class="pill">Accessible</span>
          </div>
          <p class="mt-4 text-slate-700">Beginner-friendly, equipment provided. Close to PT, step-free access.</p>
        </div>
      </div>

      <aside class="card p-5">
        <h2 class="text-lg font-semibold">Quick Registration</h2>
        <label class="mt-3 block text-sm">Full name <input class="input mt-1" placeholder="Your name" /></label>
        <label class="mt-3 block text-sm">Email <input class="input mt-1" placeholder="you@example.com" /></label>
        <label class="mt-3 block text-sm">Preferred date <input class="input mt-1" placeholder="Sat 10:00" /></label>
        <label class="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" /> I agree to privacy & child-safe policies</label>
        <button class="btn-primary mt-4 w-full">Submit</button>
      </aside>
    </div>
    <RouterLink to="/programs" class="mt-6 inline-block text-sm text-blue-700 underline">← Back to programs</RouterLink>
  </section>

  <section class="container-std py-12 text-center" v-else>
    <p class="text-lg font-semibold">Program not found</p>
    <RouterLink to="/programs" class="btn-ghost mt-3">Back to programs</RouterLink>
  </section>
</template>
