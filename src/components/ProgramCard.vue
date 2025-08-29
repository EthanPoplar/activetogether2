<script setup>
import { computed } from "vue";
import { avgRating } from "../data/programs";
const props = defineProps({ program: Object });
const rating = computed(() => avgRating(props.program).toFixed(1));
</script>

<template>
  <article class="card transition hover:shadow-md">
    <div class="h-32 w-full bg-gradient-to-tr from-blue-200 to-cyan-200"></div>
    <div class="space-y-2 p-4">
      <h3 class="line-clamp-1 text-base font-semibold">{{ program.name }}</h3>
      <p class="text-sm text-slate-600">
        {{ program.venue }} • {{ program.when }} • {{ program.cost ? '$'+program.cost : 'Free' }}
      </p>

      <div class="flex flex-wrap gap-2">
        <span v-for="t in program.tags" :key="t" class="pill">{{ t }}</span>
        <span v-if="program.accessible" class="pill">Accessible</span>
      </div>

      <div class="mt-1 text-sm">⭐ <span class="font-medium">{{ rating }}</span> average</div>

      <div class="mt-3 flex items-center gap-2">
        <RouterLink :to="`/programs/${program.id}`" class="btn-ghost">View details</RouterLink>
        <RouterLink :to="`/programs/${program.id}`" class="btn-primary">Register</RouterLink>
      </div>
    </div>
  </article>
</template>
