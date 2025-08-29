<script setup>
import { useAuth } from "../stores/auth";
const auth = useAuth();
</script>

<template>
  <section class="container-std py-10">
    <h1 class="text-2xl font-bold">Coach Dashboard</h1>
    <p class="mt-1 text-slate-600">Private area for coaches/admins.</p>

    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <div class="card p-4">
        <p class="text-sm text-slate-500">Attendance</p>
        <p class="mt-1 text-2xl font-semibold">82%</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">Sessions this week</p>
        <p class="mt-1 text-2xl font-semibold">5</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">Needs coach</p>
        <p class="mt-1 text-2xl font-semibold">1</p>
      </div>
    </div>

    <button class="btn-ghost mt-8" @click="auth.logout()">Logout</button>
  </section>
</template>
