<script setup>
import { ref } from "vue";
import { z } from "zod";
import { useAuth } from "../stores/auth";

const passwordSchema = z.string()
  .min(8, "Minimum 8 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/\d/, "Include a number");

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: passwordSchema,
  confirm: z.string(),
  role: z.enum(["participant","coach"]),
}).superRefine((val, ctx) => {
  if (val.password !== val.confirm) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirm"], message: "Passwords do not match" });
  }
});

const form = ref({ email:"", password:"", confirm:"", role:"participant" });
const errors = ref({});
const auth = useAuth();
const success = ref("");

async function submit() {
  success.value = "";
  const res = schema.safeParse({
    email: form.value.email.trim(),
    password: form.value.password,
    confirm: form.value.confirm,
    role: form.value.role,
  });
  errors.value = {};
  if (!res.success) {
    res.error.issues.forEach(i => errors.value[i.path[0]] = i.message);
    return;
  }
  try {
    await auth.register({ email: res.data.email, password: res.data.password, role: res.data.role });
    success.value = "Account created. You are now logged in.";
  } catch (e) {
    errors.value.email = e.message || "Registration failed";
  }
}
</script>

<template>
  <section class="container-std grid min-h-[60vh] place-items-center py-12">
    <div class="card w-full max-w-md p-6">
      <h1 class="text-xl font-semibold">Create account</h1>
      <label class="mt-4 block text-sm">Email
        <input v-model.trim="form.email" class="input mt-1" placeholder="you@example.com" autocomplete="email" />
        <span v-if="errors.email" class="mt-1 block text-xs text-red-600">{{ errors.email }}</span>
      </label>
      <label class="mt-3 block text-sm">Password
        <input type="password" v-model="form.password" class="input mt-1" placeholder="******" autocomplete="new-password" />
        <span v-if="errors.password" class="mt-1 block text-xs text-red-600">{{ errors.password }}</span>
      </label>
      <label class="mt-3 block text-sm">Confirm password
        <input type="password" v-model="form.confirm" class="input mt-1" placeholder="******" autocomplete="new-password" />
        <span v-if="errors.confirm" class="mt-1 block text-xs text-red-600">{{ errors.confirm }}</span>
      </label>
      <label class="mt-3 block text-sm">Role
        <select v-model="form.role" class="input mt-1">
          <option value="participant">Participant</option>
          <option value="coach">Coach</option>
        </select>
      </label>
      <button class="btn-primary mt-5 w-full" @click="submit">Sign up</button>
      <p v-if="success" class="mt-3 text-sm text-green-700">{{ success }}</p>
    </div>
  </section>
</template>
