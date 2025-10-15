<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { z } from "zod";
import VenueMap from "../components/VenueMap.vue";
import { useAuth } from "../stores/auth";
import { useReviews } from "../stores/reviews";
import { usePrograms } from "../stores/programs";
import { useEnrollments } from "../stores/enrollments";
import { programs as fallbackPrograms } from "../data/programs";

const id = useRoute().params.id;
const auth = useAuth();
const reviewsStore = useReviews();
const programsStore = usePrograms();
const enrollmentsStore = useEnrollments();

const userReviews = computed(() => reviewsStore.forProgram(id));
const program = computed(() => programsStore.items.find(p => p.id === id) || fallbackPrograms.find(p => p.id === id));
const baseReviews = computed(() => program.value?.reviews || []);
const allReviews = computed(() => [...baseReviews.value, ...userReviews.value]);
const average = computed(() => allReviews.value.length
  ? (allReviews.value.reduce((a, r) => a + (Number(r.rating) || 0), 0) / allReviews.value.length)
  : 0);

// Review form
const reviewForm = ref({ rating: 5, text: "" });
const reviewErrors = ref({});
const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  text: z.string().min(2, "Please add a short comment").max(500, "Keep it under 500 characters"),
});

function addReview() {
  reviewErrors.value = {};
  const res = reviewSchema.safeParse(reviewForm.value);
  if (!res.success) {
    res.error.issues.forEach(i => reviewErrors.value[i.path[0]] = i.message);
    return;
  }
  const user = auth.user?.email || "guest";
  reviewsStore.add(id, { user, rating: res.data.rating, text: res.data.text });
  reviewForm.value = { rating: 5, text: "" };
}

// Quick registration
const quickForm = ref({ name: "", email: "", notes: "", agree: false });
const quickErrors = ref({});
const quickSuccess = ref("");
const quickSchema = z.object({
  name: z.string().min(2, "Tell us who is attending"),
  email: z.string().email("Enter a valid email"),
  notes: z.string().max(200).optional(),
  agree: z.literal(true, { errorMap: () => ({ message: "Please accept the policy" }) }),
});

async function quickRegister() {
  quickErrors.value = {};
  quickSuccess.value = "";
  const res = quickSchema.safeParse({
    name: quickForm.value.name.trim(),
    email: quickForm.value.email.trim(),
    notes: quickForm.value.notes.trim(),
    agree: quickForm.value.agree,
  });
  if (!res.success) {
    res.error.issues.forEach(i => quickErrors.value[i.path[0]] = i.message);
    return;
  }
  try {
    await enrollmentsStore.add({
      programId: id,
      programName: program.value?.name,
      participantName: res.data.name,
      email: res.data.email,
      notes: res.data.notes,
    });
    quickSuccess.value = "Thanks! We'll be in touch soon.";
    quickForm.value = { name: "", email: "", notes: "", agree: false };
  } catch (err) {
    quickErrors.value.email = err.message || "Unable to submit. Please try again.";
  }
}

// Map + directions
const userLocation = ref(null);
const locating = ref(false);
const route = computed(() => {
  if (!userLocation.value || !program.value?.location) return null;
  return { from: userLocation.value, to: program.value.location };
});

function locateMe() {
  if (!navigator.geolocation) return;
  locating.value = true;
  navigator.geolocation.getCurrentPosition((position) => {
    userLocation.value = { lat: position.coords.latitude, lng: position.coords.longitude };
    locating.value = false;
  }, () => {
    locating.value = false;
  }, { enableHighAccuracy: true });
}

onMounted(() => {
  programsStore.init();
  enrollmentsStore.init();
});
</script>

<template>
  <section class="container-std py-8" v-if="program">
    <div class="grid gap-6 lg:grid-cols-3">
      <div class="card lg:col-span-2">
        <div class="h-56 bg-gradient-to-tr from-blue-200 to-cyan-200"></div>
        <div class="p-5 space-y-6">
          <header class="space-y-2">
            <h1 class="text-2xl font-bold">{{ program.name }}</h1>
            <p class="text-slate-600">
              <span>{{ program.venue }}</span>
              <span class="mx-2" aria-hidden="true">•</span>
              <span>{{ program.when }}</span>
            </p>
            <p class="text-sm text-slate-600">Average rating:
              <span class="font-medium">{{ average.toFixed(1) }}</span>
              ({{ allReviews.length }} reviews)
            </p>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in program.tags" :key="t" class="pill">{{ t }}</span>
              <span v-if="program.accessible" class="pill">Accessible</span>
            </div>
            <p class="text-slate-700">Beginner-friendly, equipment provided. Close to public transport and step-free access.</p>
          </header>

          <section class="space-y-3">
            <h2 class="text-lg font-semibold">Venue map & directions</h2>
            <p class="text-sm text-slate-600">Get real-time directions with Mapbox. Hit “Locate me” to draw the best driving route from your current location.</p>
            <VenueMap
              v-if="program.location"
              :center="program.location"
              :markers="[{ id: program.id, label: program.name, lat: program.location.lat, lng: program.location.lng, address: program.location.address }]"
              :route="route"
              :highlight-id="program.id"
            />
            <div class="flex items-center gap-3">
              <button class="btn-primary" type="button" :disabled="locating" @click="locateMe">
                <span v-if="!locating">Locate me</span>
                <span v-else>Locating…</span>
              </button>
              <p v-if="userLocation" class="text-xs text-slate-500">Route drawn using your current location.</p>
            </div>
          </section>

          <section class="space-y-4">
            <h2 class="text-lg font-semibold">Reviews</h2>
            <div v-if="allReviews.length" class="space-y-3">
              <div v-for="(r, idx) in allReviews" :key="idx" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div class="flex items-center justify-between text-xs text-slate-500">
                  <span>@{{ r.user }}</span>
                  <span aria-label="rating">{{ r.rating }} / 5</span>
                </div>
                <p class="mt-1 text-sm" v-html="r.text"></p>
              </div>
            </div>
            <p v-else class="text-sm text-slate-600">No reviews yet. Be the first to leave one.</p>

            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 class="text-sm font-semibold">Add your review</h3>
              <div class="mt-2 grid gap-3 sm:grid-cols-6">
                <label class="sm:col-span-2 text-sm">Rating
                  <select v-model.number="reviewForm.rating" class="input mt-1" aria-label="Rating out of 5">
                    <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
                  </select>
                </label>
                <label class="sm:col-span-4 text-sm">Comment
                  <input v-model.trim="reviewForm.text" class="input mt-1" placeholder="What did you think?" />
                </label>
              </div>
              <div class="mt-1">
                <span v-if="reviewErrors.rating" class="mr-3 text-xs text-red-600">{{ reviewErrors.rating }}</span>
                <span v-if="reviewErrors.text" class="text-xs text-red-600">{{ reviewErrors.text }}</span>
              </div>
              <div class="mt-3 flex items-center gap-3">
                <button class="btn-primary" type="button" @click="addReview">Submit review</button>
                <p v-if="!auth.isAuthed" class="text-xs text-slate-500">Posting as guest — <RouterLink to="/login" class="underline">login</RouterLink> for your name</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <aside class="card p-5 space-y-4" aria-labelledby="quick-register">
        <h2 id="quick-register" class="text-lg font-semibold">Quick Registration</h2>
        <p class="text-sm text-slate-600">Secure your place in this session. Coaches receive instant notification.</p>
        <label class="block text-sm">
          Full name
          <input v-model.trim="quickForm.name" class="input mt-1" placeholder="Your name" autocomplete="name" />
          <span v-if="quickErrors.name" class="mt-1 block text-xs text-red-600">{{ quickErrors.name }}</span>
        </label>
        <label class="block text-sm">
          Email
          <input v-model.trim="quickForm.email" class="input mt-1" placeholder="you@example.com" autocomplete="email" />
          <span v-if="quickErrors.email" class="mt-1 block text-xs text-red-600">{{ quickErrors.email }}</span>
        </label>
        <label class="block text-sm">
          Notes (optional)
          <input v-model.trim="quickForm.notes" class="input mt-1" placeholder="Accessibility, medical notes…" />
          <span v-if="quickErrors.notes" class="mt-1 block text-xs text-red-600">{{ quickErrors.notes }}</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="quickForm.agree" />
          I agree to privacy & child-safe policies
        </label>
        <span v-if="quickErrors.agree" class="block text-xs text-red-600">{{ quickErrors.agree }}</span>
        <button class="btn-primary w-full" type="button" @click="quickRegister">Submit</button>
        <p v-if="quickSuccess" class="text-sm text-green-600">{{ quickSuccess }}</p>
      </aside>
    </div>
    <RouterLink to="/programs" class="mt-6 inline-block text-sm text-blue-700 underline">Back to programs</RouterLink>
  </section>

  <section class="container-std py-12 text-center" v-else>
    <p class="text-lg font-semibold">Program not found</p>
    <RouterLink to="/programs" class="btn-ghost mt-3">Back to programs</RouterLink>
  </section>
</template>
