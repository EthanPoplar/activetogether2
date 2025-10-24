<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { z } from "zod";
import VenueMap from "../components/VenueMap.vue";
import { useAuth } from "../stores/auth";
import { useReviews } from "../stores/reviews";
import { usePrograms } from "../stores/programs";
import { useEnrollments } from "../stores/enrollments";
import { programs as fallbackPrograms } from "../data/programs";
import { useSessionNotes } from "../stores/sessionNotes";

const id = useRoute().params.id;
const auth = useAuth();
const reviewsStore = useReviews();
const programsStore = usePrograms();
const enrollmentsStore = useEnrollments();
const sessionNotesStore = useSessionNotes();

const reviews = computed(() => reviewsStore.forProgram(id));
const program = computed(() => programsStore.items.find(p => p.id === id) || fallbackPrograms.find(p => p.id === id));
const average = computed(() => reviews.value.length
  ? (reviews.value.reduce((a, r) => a + (Number(r.rating) || 0), 0) / reviews.value.length)
  : 0);

// Review form
const reviewForm = ref({ rating: 5, text: "" });
const reviewErrors = ref({});
const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  text: z.string().min(2, "Please add a short comment").max(500, "Keep it under 500 characters"),
});

async function addReview() {
  reviewErrors.value = {};
  const res = reviewSchema.safeParse(reviewForm.value);
  if (!res.success) {
    res.error.issues.forEach(i => reviewErrors.value[i.path[0]] = i.message);
    return;
  }
  const user = auth.user?.email || "guest";
  try {
    await reviewsStore.add(id, { user, rating: res.data.rating, text: res.data.text });
    reviewForm.value = { rating: 5, text: "" };
  } catch (err) {
    reviewErrors.value.text = err.message || "Unable to save review right now.";
  }
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
  reviewsStore.watch(id);
});

onUnmounted(() => {
  reviewsStore.stop(id);
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
              ({{ reviews.length }} reviews)
            </p>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in program.tags" :key="t" class="pill">{{ t }}</span>
              <span v-if="program.accessible" class="pill">Accessible</span>
            </div>
            <p class="text-slate-700">Beginner-friendly, equipment provided. Close to public transport and step-free access.</p>
          </header>

          <section class="space-y-3">
            <h2 class="text-lg font-semibold">Venue map & directions</h2>
            <p id="map-directions-description" class="text-sm text-slate-600">
              Get real-time directions with Mapbox. Use the Tab key to move into the map controls, press Enter on “Locate me,” and Escape to return to the page.
            </p>
            <VenueMap
              v-if="program.location"
              :center="program.location"
              :markers="[{ id: program.id, label: program.name, lat: program.location.lat, lng: program.location.lng, address: program.location.address }]"
              :route="route"
              :highlight-id="program.id"
              aria-describedby="map-directions-description"
            />
            <div class="flex flex-wrap items-center gap-3">
              <button class="btn-primary" type="button" :disabled="locating" @click="locateMe">
                <span v-if="!locating">Locate me</span>
                <span v-else>Locating…</span>
              </button>
              <p v-if="userLocation" class="text-xs text-slate-500">Route drawn using your current location.</p>
            </div>
          </section>

          <section class="space-y-4">
            <h2 class="text-lg font-semibold">Reviews</h2>
            <div v-if="reviews.length" class="space-y-3">
              <div v-for="r in reviews" :key="r.id || r.createdAt" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div class="flex items-center justify-between text-xs text-slate-500">
                  <span>@{{ r.user }}</span>
                  <span aria-label="rating">{{ r.rating }} / 5</span>
                </div>
                <p class="mt-1 text-sm" v-html="r.text"></p>
              </div>
            </div>
            <p v-else class="text-sm text-slate-600">No reviews yet. Be the first to leave one.</p>

            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <form @submit.prevent="addReview" aria-labelledby="add-review-heading">
                <h3 id="add-review-heading" class="text-sm font-semibold">Add your review</h3>
                <div class="mt-2 grid gap-3 sm:grid-cols-6">
                  <label class="sm:col-span-2 text-sm" for="review-rating">
                    Rating
                    <select
                      id="review-rating"
                      v-model.number="reviewForm.rating"
                      class="input mt-1"
                      aria-label="Rating out of 5"
                      :aria-invalid="!!reviewErrors.rating"
                      :aria-describedby="reviewErrors.rating ? 'review-rating-error' : undefined"
                    >
                      <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
                    </select>
                  </label>
                  <label class="sm:col-span-4 text-sm" for="review-comment">
                    Comment
                    <input
                      id="review-comment"
                      v-model.trim="reviewForm.text"
                      class="input mt-1"
                      placeholder="What did you think?"
                      inputmode="text"
                      :aria-invalid="!!reviewErrors.text"
                      :aria-describedby="reviewErrors.text ? 'review-comment-error' : undefined"
                    />
                  </label>
                </div>
                <div class="mt-1">
                  <span v-if="reviewErrors.rating" id="review-rating-error" class="mr-3 text-xs text-red-600" role="alert">{{ reviewErrors.rating }}</span>
                  <span v-if="reviewErrors.text" id="review-comment-error" class="text-xs text-red-600" role="alert">{{ reviewErrors.text }}</span>
                </div>
                <div class="mt-3 flex items-center gap-3">
                  <button class="btn-primary" type="submit">Submit review</button>
                  <p v-if="!auth.isAuthed" class="text-xs text-slate-500">Posting as guest — <RouterLink to="/login" class="underline">login</RouterLink> for your name</p>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>

      <aside class="space-y-4 lg:col-span-1" aria-label="Coach tools">
        <div class="card p-5" aria-labelledby="session-notes-heading">
          <h2 id="session-notes-heading" class="text-lg font-semibold">Prep notes</h2>
          <p class="text-sm text-slate-600">Capture reminders and ideas for this session.</p>
          <textarea
            class="input mt-3 h-32 resize-y"
            v-model="notes"
            placeholder="Equipment, warm-up ideas, participant needs…"
            aria-describedby="session-notes-status"
          ></textarea>
          <div class="mt-3 flex gap-2">
            <button class="btn-primary" type="button" @click="saveNotes">Save notes</button>
            <button class="btn-ghost" type="button" @click="clearNotes">Clear</button>
          </div>
          <p id="session-notes-status" class="mt-2 text-xs text-slate-500" role="status" aria-live="polite">{{ notesStatus }}</p>
        </div>

        <div class="card p-5" aria-labelledby="quick-register">
          <h2 id="quick-register" class="text-lg font-semibold">Quick Registration</h2>
          <p class="text-sm text-slate-600">Secure your place in this session. Coaches receive instant notification.</p>
          <form class="mt-4 space-y-4" @submit.prevent="quickRegister">
          <label class="block text-sm" for="quick-name">
            Full name
            <input
              id="quick-name"
              v-model.trim="quickForm.name"
              class="input mt-1"
              placeholder="Your name"
              autocomplete="name"
              :aria-invalid="!!quickErrors.name"
              :aria-describedby="quickErrors.name ? 'quick-name-error' : undefined"
            />
            <span v-if="quickErrors.name" id="quick-name-error" class="mt-1 block text-xs text-red-600" role="alert">{{ quickErrors.name }}</span>
          </label>

          <label class="block text-sm" for="quick-email">
            Email
            <input
              id="quick-email"
              v-model.trim="quickForm.email"
              class="input mt-1"
              placeholder="you@example.com"
              autocomplete="email"
              :aria-invalid="!!quickErrors.email"
              :aria-describedby="quickErrors.email ? 'quick-email-error' : undefined"
            />
            <span v-if="quickErrors.email" id="quick-email-error" class="mt-1 block text-xs text-red-600" role="alert">{{ quickErrors.email }}</span>
          </label>

          <label class="block text-sm" for="quick-notes">
            Notes (optional)
            <input
              id="quick-notes"
              v-model.trim="quickForm.notes"
              class="input mt-1"
              placeholder="Accessibility, medical notes…"
              :aria-invalid="!!quickErrors.notes"
              :aria-describedby="quickErrors.notes ? 'quick-notes-error' : undefined"
            />
            <span v-if="quickErrors.notes" id="quick-notes-error" class="mt-1 block text-xs text-red-600" role="alert">{{ quickErrors.notes }}</span>
          </label>

          <div class="flex items-center gap-2 text-sm">
            <input
              id="quick-agree"
              type="checkbox"
              v-model="quickForm.agree"
              :aria-describedby="quickErrors.agree ? 'quick-agree-error' : undefined"
            />
            <label for="quick-agree">I agree to privacy & child-safe policies</label>
          </div>
          <span v-if="quickErrors.agree" id="quick-agree-error" class="block text-xs text-red-600" role="alert">{{ quickErrors.agree }}</span>

          <button class="btn-primary w-full" type="submit">Submit</button>
          <p v-if="quickSuccess" class="text-sm text-green-600" role="status" aria-live="polite">{{ quickSuccess }}</p>
        </form>
        </div>
      </aside>
    </div>
    <RouterLink to="/programs" class="mt-6 inline-block text-sm text-blue-700 underline">Back to programs</RouterLink>
  </section>

  <section class="container-std py-12 text-center" v-else>
    <p class="text-lg font-semibold">Program not found</p>
    <RouterLink to="/programs" class="btn-ghost mt-3">Back to programs</RouterLink>
  </section>
</template>



const notes = ref(sessionNotesStore.load(id));
const notesStatus = ref(notes.value ? "Notes loaded." : "");

function saveNotes() {
  sessionNotesStore.save(id, notes.value);
  notesStatus.value = notes.value.trim() ? "Notes saved." : "Notes cleared.";
}

function clearNotes() {
  notes.value = "";
  sessionNotesStore.clear(id);
  notesStatus.value = "Notes cleared.";
}
