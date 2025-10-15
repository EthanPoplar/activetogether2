<script setup>
import { computed, onMounted, ref } from "vue";
import { httpsCallable } from "firebase/functions";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../stores/auth";
import { usePrograms } from "../stores/programs";
import { useEnrollments } from "../stores/enrollments";
import DataTable from "../components/DataTable.vue";
import AttendanceChart from "../components/AttendanceChart.vue";
import { exportToCsv, exportToPdf } from "../utils/export";
import { functions, storage } from "../lib/firebase";

const auth = useAuth();
const programsStore = usePrograms();
const enrollmentsStore = useEnrollments();

const emailForm = ref({
  programId: "",
  subject: "",
  message: "",
  file: null,
});
const sendingEmail = ref(false);
const emailStatus = ref("");

const enrollmentTableColumns = [
  { key: "participantName", label: "Participant", sortable: true, filterable: true },
  { key: "programName", label: "Program", sortable: true, filterable: true },
  { key: "email", label: "Email", sortable: true, filterable: true },
  { key: "createdAt", label: "Created", sortable: true },
];

const programTableColumns = [
  { key: "name", label: "Program", sortable: true, filterable: true },
  { key: "venue", label: "Venue", sortable: true, filterable: true },
  { key: "when", label: "Schedule", sortable: true, filterable: true },
  { key: "cost", label: "Cost", sortable: true },
  { key: "accessible", label: "Accessible", sortable: true },
];

const programOptions = computed(() => programsStore.items.map(p => ({ id: p.id, name: p.name })));

const stats = computed(() => {
  const enrollments = enrollmentsStore.records;
  const uniqueParticipants = new Set(enrollments.map(e => e.email));
  return {
    totalPrograms: programsStore.items.length,
    totalEnrollments: enrollments.length,
    uniqueParticipants: uniqueParticipants.size,
  };
});

const chartData = computed(() => {
  if (!programsStore.items.length) return [];
  return programsStore.items.map(program => ({
    label: program.name,
    value: enrollmentsStore.records.filter(rec => rec.programId === program.id).length,
  }));
});

async function handleEmailSubmit() {
  emailStatus.value = "";
  sendingEmail.value = true;
  try {
    let attachmentUrl = null;
    if (emailForm.value.file) {
      const safeName = `${emailForm.value.programId}-${Date.now()}-${emailForm.value.file.name}`;
      const destination = storageRef(storage, `email-attachments/${safeName}`);
      const snapshot = await uploadBytes(destination, emailForm.value.file);
      attachmentUrl = await getDownloadURL(snapshot.ref);
    }
    const callable = httpsCallable(functions, "sendProgramEmail");
    await callable({
      programId: emailForm.value.programId,
      subject: emailForm.value.subject,
      message: emailForm.value.message,
      attachmentUrl,
    });
    emailStatus.value = "Email queued for delivery.";
    emailForm.value = { programId: "", subject: "", message: "", file: null };
  } catch (err) {
    console.error(err);
    emailStatus.value = "Failed to send email. Please try again.";
  } finally {
    sendingEmail.value = false;
  }
}

function exportEnrollments(format) {
  const rows = enrollmentsStore.records.map(rec => ({
    Participant: rec.participantName,
    Program: rec.programName,
    Email: rec.email,
    Notes: rec.notes || "",
    Created: rec.createdAt?.toDate ? rec.createdAt.toDate().toLocaleString() : rec.createdAt,
  }));
  if (!rows.length) return;
  if (format === "csv") exportToCsv("enrollments", rows);
  if (format === "pdf") exportToPdf("enrollments", rows);
}

function exportPrograms() {
  const rows = programsStore.items.map(program => ({
    Name: program.name,
    Venue: program.venue,
    Schedule: program.when,
    Cost: program.cost,
    Accessible: program.accessible ? "Yes" : "No",
  }));
  if (!rows.length) return;
  exportToCsv("programs", rows);
}

onMounted(async () => {
  await auth.init();
  programsStore.init();
  enrollmentsStore.init();
});
</script>

<template>
  <section class="container-std py-10 space-y-8">
    <header>
      <h1 class="text-2xl font-bold">Coach Dashboard</h1>
      <p class="mt-1 text-slate-600">Monitor enrollments, communicate with participants, and export records.</p>
    </header>

    <div class="grid gap-4 sm:grid-cols-3" role="list">
      <div class="card p-4" role="listitem">
        <p class="text-sm text-slate-500">Active programs</p>
        <p class="mt-1 text-2xl font-semibold">{{ stats.totalPrograms }}</p>
      </div>
      <div class="card p-4" role="listitem">
        <p class="text-sm text-slate-500">Enrollments</p>
        <p class="mt-1 text-2xl font-semibold">{{ stats.totalEnrollments }}</p>
      </div>
      <div class="card p-4" role="listitem">
        <p class="text-sm text-slate-500">Unique participants</p>
        <p class="mt-1 text-2xl font-semibold">{{ stats.uniqueParticipants }}</p>
      </div>
    </div>

    <div class="card p-5">
      <h2 class="text-lg font-semibold">Enrollment trends</h2>
      <p class="text-sm text-slate-600">Track sign-ups per program to balance coaching capacity.</p>
      <div class="mt-4">
        <AttendanceChart :data-points="chartData" />
      </div>
    </div>

    <section aria-labelledby="program-table-heading" class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 id="program-table-heading" class="text-lg font-semibold">Programs</h2>
          <p class="text-sm text-slate-600">Sort, search, and paginate through all active programs.</p>
        </div>
        <button class="btn-ghost" type="button" @click="exportPrograms">Export CSV</button>
      </div>
      <DataTable :columns="programTableColumns" :rows="programsStore.items" :loading="programsStore.loading">
        <template #cell-accessible="{ row }">
          <span class="pill" :class="row.accessible ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'">
            {{ row.accessible ? "Yes" : "No" }}
          </span>
        </template>
      </DataTable>
    </section>

    <section aria-labelledby="enrollment-table-heading" class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="enrollment-table-heading" class="text-lg font-semibold">Enrollments</h2>
          <p class="text-sm text-slate-600">At-a-glance roster for upcoming sessions.</p>
        </div>
        <div class="flex gap-2">
          <button class="btn-ghost" type="button" @click="exportEnrollments('csv')">Export CSV</button>
          <button class="btn-ghost" type="button" @click="exportEnrollments('pdf')">Export PDF</button>
        </div>
      </div>
      <DataTable :columns="enrollmentTableColumns" :rows="enrollmentsStore.records" :loading="enrollmentsStore.loading">
        <template #cell-createdAt="{ row }">
          {{ row.createdAt?.toDate ? row.createdAt.toDate().toLocaleString() : row.createdAt || "Pending" }}
        </template>
      </DataTable>
    </section>

    <section aria-labelledby="email-heading" class="card p-5 space-y-4">
      <header>
        <h2 id="email-heading" class="text-lg font-semibold">Bulk program email</h2>
        <p class="text-sm text-slate-600">Send updates to everyone enrolled in a specific program. Attachments are stored in Firebase Storage and delivered via SendGrid.</p>
      </header>
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="handleEmailSubmit">
        <label class="text-sm">
          <span class="mb-1 block font-semibold text-slate-700">Program</span>
          <select v-model="emailForm.programId" class="input" required>
            <option value="" disabled>Select a program</option>
            <option v-for="program in programOptions" :key="program.id" :value="program.id">
              {{ program.name }}
            </option>
          </select>
        </label>
        <label class="text-sm">
          <span class="mb-1 block font-semibold text-slate-700">Subject</span>
          <input v-model="emailForm.subject" class="input" placeholder="Upcoming session reminder" required />
        </label>
        <label class="text-sm md:col-span-2">
          <span class="mb-1 block font-semibold text-slate-700">Message</span>
          <textarea
            v-model="emailForm.message"
            class="input h-28 resize-none"
            placeholder="Share venue updates, coach notes or preparation tips."
            required
          ></textarea>
        </label>
        <label class="text-sm md:col-span-2">
          <span class="mb-1 block font-semibold text-slate-700">Attachment (optional)</span>
          <input
            type="file"
            class="input"
            @change="emailForm.file = $event.target.files?.[0] || null"
            accept=".pdf,.doc,.docx,.csv,.jpg,.png"
          />
        </label>
        <div class="md:col-span-2 flex items-center gap-3">
          <button class="btn-primary" type="submit" :disabled="sendingEmail">
            <span v-if="!sendingEmail">Send email</span>
            <span v-else>Sending…</span>
          </button>
          <p v-if="emailStatus" class="text-sm" :class="emailStatus.includes('Failed') ? 'text-red-600' : 'text-green-600'">
            {{ emailStatus }}
          </p>
        </div>
      </form>
    </section>

    <button class="btn-ghost" type="button" @click="auth.logout()">Logout</button>
  </section>
</template>
