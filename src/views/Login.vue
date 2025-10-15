<script setup>
import { ref } from "vue";
import { z } from "zod";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "../stores/auth";
const auth = useAuth();
const route = useRoute();
const router = useRouter();

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
});
const form = ref({ email: "", password: "" });
const errors = ref({});
const errorMsg = ref("");
const submitting = ref(false);

async function submit() {
  errors.value = {}; errorMsg.value = "";
  const res = schema.safeParse({ email: form.value.email.trim(), password: form.value.password });
  if (!res.success) {
    res.error.issues.forEach(i => errors.value[i.path[0]] = i.message);
    return;
  }
  try {
    submitting.value = true;
    await auth.login(res.data);
    const redirect = route.query.redirect || "/";
    router.push(String(redirect));
  } catch (e) {
    errorMsg.value = "Invalid email or password";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="container-std grid min-h-[60vh] place-items-center py-12">
    <div class="card w-full max-w-md p-6">
      <h1 class="text-xl font-semibold">Login</h1>
      <p class="mt-1 text-sm text-slate-600">Coaches can access the dashboard.</p>
      <label class="mt-4 block text-sm">Email
        <input v-model.trim="form.email" class="input mt-1" placeholder="you@example.com" autocomplete="email" />
        <span v-if="errors.email" class="mt-1 block text-xs text-red-600">{{ errors.email }}</span>
      </label>
      <label class="mt-3 block text-sm">Password
        <input type="password" v-model="form.password" class="input mt-1" placeholder="******" autocomplete="current-password" />
        <span v-if="errors.password" class="mt-1 block text-xs text-red-600">{{ errors.password }}</span>
      </label>
      <button class="btn-primary mt-5 w-full disabled:opacity-60" :disabled="submitting" @click="submit">
        <span v-if="!submitting">Login</span>
        <span v-else>Signing in…</span>
      </button>
      <p v-if="errorMsg" class="mt-3 text-sm text-red-700">{{ errorMsg }}</p>
      <RouterLink to="/register" class="mt-3 block text-center text-sm text-slate-600 underline">Need an account?</RouterLink>
    </div>
  </section>
</template>
