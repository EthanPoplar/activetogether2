<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  pageSize: { type: Number, default: 10 },
  loading: { type: Boolean, default: false },
  emptyMessage: { type: String, default: "No records found." },
});

const emit = defineEmits(["row-click"]);

const sortState = ref({ key: "", dir: "asc" });
const filters = ref({});
const page = ref(1);

watch(() => props.rows, () => { page.value = 1; }, { deep: true });

const filteredRows = computed(() => {
  const activeFilters = Object.entries(filters.value).filter(([, value]) => value);
  if (!activeFilters.length) return props.rows;
  return props.rows.filter((row) =>
    activeFilters.every(([key, value]) => {
      const cell = String(row[key] ?? "").toLowerCase();
      return cell.includes(String(value).toLowerCase());
    })
  );
});

const sortedRows = computed(() => {
  if (!sortState.value.key) return filteredRows.value;
  const { key, dir } = sortState.value;
  return [...filteredRows.value].sort((a, b) => {
    const left = a[key];
    const right = b[key];
    if (left === right) return 0;
    if (left == null) return dir === "asc" ? -1 : 1;
    if (right == null) return dir === "asc" ? 1 : -1;
    const comp = String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
    return dir === "asc" ? comp : -comp;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / props.pageSize)));

const paginatedRows = computed(() => {
  const start = (page.value - 1) * props.pageSize;
  return sortedRows.value.slice(start, start + props.pageSize);
});

function toggleSort(key) {
  if (sortState.value.key !== key) {
    sortState.value = { key, dir: "asc" };
    return;
  }
  sortState.value = {
    key,
    dir: sortState.value.dir === "asc" ? "desc" : "asc",
  };
}

function updateFilter(key, value) {
  filters.value = { ...filters.value, [key]: value };
  page.value = 1;
}

function setPage(next) {
  if (next < 1 || next > totalPages.value) return;
  page.value = next;
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-4" role="search">
      <label
        v-for="col in columns.filter(c => c.filterable)"
        :key="col.key"
        class="text-xs font-semibold text-slate-600"
      >
        <span class="block">{{ col.label }} filter</span>
        <input
          class="input mt-1"
          type="search"
          :placeholder="`Search ${col.label.toLowerCase()}`"
          :value="filters[col.key] || ''"
          @input="updateFilter(col.key, $event.target.value)"
        />
      </label>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm" role="region" aria-live="polite">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              <button
                v-if="col.sortable"
                class="flex items-center gap-1 text-left"
                type="button"
                @click="toggleSort(col.key)"
              >
                <span>{{ col.label }}</span>
                <span aria-hidden="true">
                  <span v-if="sortState.key === col.key">
                    {{ sortState.dir === "asc" ? "▲" : "▼" }}
                  </span>
                </span>
              </button>
              <span v-else>{{ col.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="px-3 py-6 text-center text-sm text-slate-500">
              Loading…
            </td>
          </tr>
          <tr v-else-if="!paginatedRows.length">
            <td :colspan="columns.length" class="px-3 py-6 text-center text-sm text-slate-500">
              {{ emptyMessage }}
            </td>
          </tr>
          <tr
            v-for="row in paginatedRows"
            :key="row.id"
            class="odd:bg-white even:bg-slate-50 hover:bg-slate-100 focus-within:bg-slate-100 cursor-pointer"
            tabindex="0"
            @click="emit('row-click', row)"
            @keyup.enter="emit('row-click', row)"
            @keyup.space.prevent="emit('row-click', row)"
          >
            <td v-for="col in columns" :key="col.key" class="px-3 py-3 text-sm text-slate-700">
              <slot :name="`cell-${col.key}`" :row="row">
                {{ row[col.key] ?? "—" }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav class="flex items-center justify-between" aria-label="Table pagination">
      <p class="text-xs text-slate-500">
        Page {{ page }} of {{ totalPages }} • {{ sortedRows.length }} result<span v-if="sortedRows.length !== 1">s</span>
      </p>
      <div class="flex items-center gap-2">
        <button class="btn-ghost px-3 py-2 disabled:opacity-50" type="button" :disabled="page === 1" @click="setPage(page - 1)">
          Previous
        </button>
        <button class="btn-ghost px-3 py-2 disabled:opacity-50" type="button" :disabled="page === totalPages" @click="setPage(page + 1)">
          Next
        </button>
      </div>
    </nav>
  </div>
</template>
