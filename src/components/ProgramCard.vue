<script setup>
import { computed } from "vue";
import { useReviews } from "../stores/reviews";

const props = defineProps({
  program: { type: Object, required: true },
  favorite: { type: Boolean, default: false },
});
const emit = defineEmits(["toggle-favorite"]);
const reviewsStore = useReviews();

const rating = computed(() => {
  const base = props.program.reviews || [];
  const extra = reviewsStore.forProgram(props.program.id) || [];
  const all = [...base, ...extra];
  if (!all.length) return "0.0";
  const avg = all.reduce((a, r) => a + (Number(r.rating) || 0), 0) / all.length;
  return avg.toFixed(1);
});
</script>

<template>
  <article class="card transition hover:shadow-md" tabindex="0">
    <div class="h-32 w-full bg-gradient-to-tr from-blue-200 to-cyan-200" role="presentation"></div>
    <div class="space-y-2 p-4">
      <div class="flex items-start justify-between gap-3">
        <h3 class="line-clamp-1 text-base font-semibold">{{ program.name }}</h3>
        <button
          class="rounded-full border border-slate-200 bg-white p-2 text-xs text-slate-500 hover:bg-slate-100"
          type="button"
          :aria-pressed="favorite"
          :aria-label="favorite ? 'Remove from saved programs' : 'Save program for later'"
          @click.stop="emit('toggle-favorite', program.id)"
        >
          <span aria-hidden="true">{{ favorite ? '★' : '☆' }}</span>
        </button>
      </div>
      <p class="text-sm text-slate-600">
        {{ program.venue }} • {{ program.when }} • {{ program.cost ? '$'+program.cost : 'Free' }}
      </p>

      <div class="flex flex-wrap gap-2">
        <span v-for="t in program.tags" :key="t" class="pill">{{ t }}</span>
        <span v-if="program.accessible" class="pill">Accessible</span>
      </div>

      <div class="mt-1 text-sm" aria-label="Average rating">
        ⭐ <span class="font-medium">{{ rating }}</span> average
      </div>

      <div class="mt-3 flex items-center gap-2">
        <RouterLink :to="`/programs/${program.id}`" class="btn-ghost">View details</RouterLink>
        <RouterLink :to="`/programs/${program.id}`" class="btn-primary">Register</RouterLink>
      </div>
    </div>
  </article>
</template>
