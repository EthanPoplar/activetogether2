<template>
  <div class="min-h-screen">
    <header class="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <nav class="mx-auto max-w-7xl px-4 flex h-14 items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 font-semibold">
          <span class="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white">NFP</span>
          <span class="hidden sm:block">Community Sport</span>
        </RouterLink>
        <div class="hidden gap-6 text-sm sm:flex">
          <RouterLink to="/programs" class="text-slate-600 hover:text-slate-900">Programs</RouterLink>
          <RouterLink to="/dashboard" class="text-slate-600 hover:text-slate-900">Dashboard</RouterLink>
        </div>
        <div class="flex items-center gap-2">
          <RouterLink to="/login" class="border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-semibold shadow-sm">Login</RouterLink>
          <RouterLink to="/register" class="px-3 py-2 rounded-lg text-sm font-semibold shadow-sm bg-blue-600 text-white hover:bg-blue-700">Sign up</RouterLink>
        </div>
      </nav>
    </header>

    <RouterView />
  </div>
</template>
