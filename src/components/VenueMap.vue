<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import mapboxgl from "mapbox-gl";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  center: { type: Object, required: true }, // { lat, lng }
  markers: { type: Array, default: () => [] },
  highlightId: { type: String, default: "" },
  route: { type: Object, default: null }, // { from: { lat, lng }, to: { lat, lng } }
});

const container = ref(null);
let map;
const markerMap = new Map();

function getAccessToken() {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  if (!token) {
    console.warn("Missing Mapbox token. Add VITE_MAPBOX_TOKEN to .env.");
  }
  return token;
}

function createMarker(marker) {
  const el = document.createElement("div");
  el.className = "mapbox-marker";
  el.innerHTML = `<span>${marker.label}</span>`;
  const instance = new mapboxgl.Marker({
    color: marker.id === props.highlightId ? "#2563eb" : "#111827",
  }).setLngLat([marker.lng, marker.lat]).setPopup(new mapboxgl.Popup().setHTML(`<strong>${marker.label}</strong><p>${marker.address || ""}</p>`));
  instance.addTo(map);
  markerMap.set(marker.id, instance);
}

function syncMarkers() {
  const newIds = new Set();
  props.markers.forEach((marker) => {
    newIds.add(marker.id);
    const existing = markerMap.get(marker.id);
    if (existing) {
      existing.setLngLat([marker.lng, marker.lat]);
      existing.getElement().style.backgroundColor = marker.id === props.highlightId ? "#2563eb" : "#111827";
      return;
    }
    createMarker(marker);
  });
  markerMap.forEach((instance, id) => {
    if (!newIds.has(id)) {
      instance.remove();
      markerMap.delete(id);
    }
  });
}

async function renderRoute() {
  if (!props.route || !props.route.from || !props.route.to || !getAccessToken()) {
    if (map?.getSource("route")) {
      map.removeLayer("route-line");
      map.removeSource("route");
    }
    return;
  }
  const { from, to } = props.route;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&access_token=${getAccessToken()}`;
  const response = await fetch(url);
  const data = await response.json();
  const geometry = data?.routes?.[0]?.geometry;
  if (!geometry) return;
  if (map.getSource("route")) {
    map.getSource("route").setData({
      type: "Feature",
      properties: {},
      geometry,
    });
  } else {
    map.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry,
      },
    });
    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#2563eb", "line-width": 4 },
    });
  }
}

onMounted(() => {
  const token = getAccessToken();
  if (!token) return;
  mapboxgl.accessToken = token;
  map = new mapboxgl.Map({
    container: container.value,
    style: "mapbox://styles/mapbox/streets-v12",
    center: [props.center.lng, props.center.lat],
    zoom: 12,
  });
  map.addControl(new mapboxgl.NavigationControl());
  map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true,
  }));
  map.on("load", () => {
    syncMarkers();
    renderRoute();
  });
});

onUnmounted(() => {
  markerMap.forEach(marker => marker.remove());
  if (map) map.remove();
});

watch(() => props.markers, () => {
  if (!map) return;
  syncMarkers();
}, { deep: true });

watch(() => props.route, () => {
  if (!map) return;
  renderRoute();
}, { deep: true });

watch(() => props.center, () => {
  if (!map) return;
  map.flyTo({ center: [props.center.lng, props.center.lat], zoom: 13 });
});
</script>

<template>
  <div
    ref="container"
    class="h-72 w-full rounded-xl border border-slate-200"
    role="application"
    tabindex="0"
    aria-label="Interactive map showing program location"
    v-bind="$attrs"
  ></div>
</template>

<style scoped>
.mapbox-marker {
  background: #111827;
  color: #fff;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}
</style>
