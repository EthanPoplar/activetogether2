<script setup>
import { ref } from "vue";
import { z } from "zod";
import { useAuth } from "../stores/auth";
const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  role: z.enum(["participant","coach"]),
});
const form = ref({ email:"", password:"", role:"participant" });
const errors = ref({});
const auth = useAuth();
function submit() {
  const res = schema.safeParse(form.value);
  errors.value = {};
  if (!res.success) res.error.issues.forEach(i => errors.value[i.path[0]] = i.message);
  else auth.login({ email: form.value.email, role: form.value.role });
}
</script>

<template>
  <section class="container-std grid min-h-[60vh] place-items-center py-12">
    <div class="card w-full max-w-md p-6">
      <h1 class="text-xl font-semibold">Create account</h1>
      <label class="mt-4 block text-sm">Email
        <input v-model="form.email" class="input mt-1" placeholder="you@example.com" />
        <span v-if="errors.email" class="mt-1 block text-xs text-red-600">{{ errors.email }}</span>
      </label>
      <label class="mt-3 block text-sm">Password
        <input type="password" v-model="form.password" class="input mt-1" placeholder="******" />
        <span v-if="errors.password" class="mt-1 block text-xs text-red-600">{{ errors.password }}</span>
      </label>
      <label class="mt-3 block text-sm">Role
        <select v-model="form.role" class="input mt-1">
          <option value="participant">Participant</option>
          <option value="coach">Coach</option>
        </select>
      </label>
      <button class="btn-primary mt-5 w-full" @click="submit">Sign up</button>
    </div>
  </section>
</template>
