<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const props = defineProps({
  dataPoints: { type: Array, required: true }, // [{ label, value }]
});

const canvasRef = ref(null);
let chart;

const renderChart = () => {
  if (!canvasRef.value) return;
  const labels = props.dataPoints.map(p => p.label);
  const data = props.dataPoints.map(p => p.value);
  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
    return;
  }
  chart = new Chart(canvasRef.value, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Enrollments",
          data,
          backgroundColor: "rgba(37, 99, 235, 0.6)",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
};

onMounted(renderChart);
watch(() => props.dataPoints, renderChart, { deep: true });
onUnmounted(() => { chart?.destroy(); });
</script>

<template>
  <canvas ref="canvasRef" aria-label="Enrollment chart" role="img"></canvas>
</template>
