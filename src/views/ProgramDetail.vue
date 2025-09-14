<script setup>
import { ref, computed } from "vue";
import { z } from "zod";
import { programs } from "../data/programs";
import { useRoute } from "vue-router";
import { useReviews } from "../stores/reviews";
import { useAuth } from "../stores/auth";

const id = useRoute().params.id;
const program = programs.find(p => p.id === id);
const reviewsStore = useReviews();
const auth = useAuth();

const baseReviews = program ? program.reviews : [];
const userReviews = computed(() => reviewsStore.forProgram(id));
const allReviews = computed(() => [...baseReviews, ...userReviews.value]);

const average = computed(() => allReviews.value.length
  ? (allReviews.value.reduce((a, r) => a + (Number(r.rating) || 0), 0) / allReviews.value.length)
  : 0);

// Review form
const form = ref({ rating: 5, text: "" });
const errors = ref({});
const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  text: z.string().min(2, "Please add a short comment").max(500, "Keep it under 500 characters"),
});

function addReview() {
  errors.value = {};
  const res = reviewSchema.safeParse(form.value);
  if (!res.success) {
    res.error.issues.forEach(i => errors.value[i.path[0]] = i.message);
    return;
  }
  const user = auth.user?.email || "guest";
  reviewsStore.add(id, { user, rating: res.data.rating, text: res.data.text });
  form.value = { rating: 5, text: "" };
}
</script>

<template>
  <section class="container-std py-8" v-if="program">
    <div class="grid gap-6 lg:grid-cols-3">
      <div class="card lg:col-span-2">
        <div class="h-56 bg-gradient-to-tr from-blue-200 to-cyan-200"></div>
        <div class="p-5">
          <h1 class="text-2xl font-bold">{{ program.name }}</h1>
          <p class="mt-1 text-slate-600">{{ program.venue }} • {{ program.when }}</p>
          <p class="mt-2 text-sm">Average rating: ⭐ <span class="font-medium">{{ average.toFixed(1) }}</span> ({{ allReviews.length }} reviews)</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span v-for="t in program.tags" :key="t" class="pill">{{ t }}</span>
            <span v-if="program.accessible" class="pill">Accessible</span>
          </div>
          <p class="mt-4 text-slate-700">Beginner-friendly, equipment provided. Close to PT, step-free access.</p>

          <div class="mt-8">
            <h2 class="text-lg font-semibold">Reviews</h2>
            <div v-if="allReviews.length" class="mt-3 space-y-3">
              <div v-for="(r, idx) in allReviews" :key="idx" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div class="flex items-center justify-between text-xs text-slate-500">
                  <span>@{{ r.user }}</span>
                  <span>⭐ {{ r.rating }}</span>
                </div>
                <p class="mt-1 text-sm" v-html="r.text"></p>
              </div>
            </div>
            <p v-else class="mt-2 text-sm text-slate-600">No reviews yet. Be the first to leave one.</p>

            <div class="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 class="text-sm font-semibold">Add your review</h3>
              <div class="mt-2 grid gap-3 sm:grid-cols-6">
                <label class="sm:col-span-2 text-sm">Rating
                  <select v-model.number="form.rating" class="input mt-1">
                    <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
                  </select>
                </label>
                <label class="sm:col-span-4 text-sm">Comment
                  <input v-model.trim="form.text" class="input mt-1" placeholder="What did you think?" />
                </label>
              </div>
              <div class="mt-1">
                <span v-if="errors.rating" class="mr-3 text-xs text-red-600">{{ errors.rating }}</span>
                <span v-if="errors.text" class="text-xs text-red-600">{{ errors.text }}</span>
              </div>
              <div class="mt-3 flex items-center gap-3">
                <button class="btn-primary" @click="addReview">Submit review</button>
                <p v-if="!auth.isAuthed" class="text-xs text-slate-500">Posting as guest — <RouterLink to="/login" class="underline">login</RouterLink> for your name</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="card p-5">
        <h2 class="text-lg font-semibold">Quick Registration</h2>
        <label class="mt-3 block text-sm">Full name <input class="input mt-1" placeholder="Your name" autocomplete="name" /></label>
        <label class="mt-3 block text-sm">Email <input class="input mt-1" placeholder="you@example.com" autocomplete="email" /></label>
        <label class="mt-3 block text-sm">Preferred date <input class="input mt-1" placeholder="Sat 10:00" autocomplete="off" /></label>
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
