<script setup>
import { ref } from "vue";
import { useAuth } from "../stores/auth";
const auth = useAuth();
const email = ref("coach@example.com");
const role = ref("coach");
function submit(){ auth.login({ email: email.value, role: role.value }); }
</script>

<template>
  <section class="container-std grid min-h-[60vh] place-items-center py-12">
    <div class="card w-full max-w-md p-6">
      <h1 class="text-xl font-semibold">Login</h1>
      <p class="mt-1 text-sm text-slate-600">Use coach role to see the dashboard.</p>
      <label class="mt-4 block text-sm">Email <input v-model="email" class="input mt-1" placeholder="you@example.com" /></label>
      <label class="mt-3 block text-sm">Role
        <select v-model="role" class="input mt-1">
          <option value="participant">Participant</option>
          <option value="coach">Coach</option>
        </select>
      </label>
      <button class="btn-primary mt-5 w-full" @click="submit">Login</button>
      <RouterLink to="/register" class="mt-3 block text-center text-sm text-slate-600 underline">Need an account?</RouterLink>
    </div>
  </section>
</template>
