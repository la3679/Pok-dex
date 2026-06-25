export function clusterSightings(sightings, cellSize = 1.2) {
  const groups = new Map();
  sightings.forEach((sighting) => {
    const [lng, lat] = sighting.location?.coordinates || [];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const key = `${Math.floor(lat / cellSize)}:${Math.floor(lng / cellSize)}`;
    const group = groups.get(key) || { sightings: [], lat: 0, lng: 0 };
    group.sightings.push(sighting); group.lat += lat; group.lng += lng;
    groups.set(key, group);
  });
  return [...groups.values()].map((group) => ({ ...group, lat: group.lat / group.sightings.length, lng: group.lng / group.sightings.length, count: group.sightings.length }));
}

export function heatmapBuckets(sightings, project, cellSize = 42) {
  const buckets = new Map();
  sightings.forEach((sighting) => {
    const [lng, lat] = sighting.location?.coordinates || [];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const point = project(lat, lng);
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;
    const bucket = buckets.get(key) || { x: 0, y: 0, count: 0 };
    bucket.x += point.x; bucket.y += point.y; bucket.count += 1;
    buckets.set(key, bucket);
  });
  return [...buckets.values()].map((bucket) => ({ ...bucket, x: bucket.x / bucket.count, y: bucket.y / bucket.count }));
}

export function createHeatmapOverlay(google, map, sightings, radius = 38) {
  if (!google?.maps?.OverlayView) throw new Error('Google Maps overlay support is unavailable.');
  let canvas;
  const overlay = new google.maps.OverlayView();
  overlay.onAdd = function onAdd() {
    canvas = document.createElement('canvas');
    canvas.className = 'sightings-heatmap';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.left = '0';
    canvas.style.top = '0';
    this.getPanes().overlayLayer.appendChild(canvas);
  };
  overlay.draw = function draw() {
    const projection = this.getProjection();
    const mapElement = map.getDiv();
    if (!canvas || !projection || !mapElement) return;
    const bounds = mapElement.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(bounds.width * pixelRatio);
    canvas.height = Math.round(bounds.height * pixelRatio);
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.height);
    const buckets = heatmapBuckets(sightings, (lat, lng) => projection.fromLatLngToDivPixel(new google.maps.LatLng(lat, lng)));
    const maximum = Math.max(...buckets.map((bucket) => bucket.count), 1);
    buckets.forEach((bucket) => {
      const intensity = 0.2 + (bucket.count / maximum) * 0.8;
      const gradient = context.createRadialGradient(bucket.x, bucket.y, 0, bucket.x, bucket.y, radius);
      gradient.addColorStop(0, `rgba(235, 73, 69, ${intensity})`);
      gradient.addColorStop(0.38, `rgba(246, 182, 77, ${intensity * 0.78})`);
      gradient.addColorStop(0.7, `rgba(225, 76, 121, ${intensity * 0.36})`);
      gradient.addColorStop(1, 'rgba(225, 76, 121, 0)');
      context.fillStyle = gradient;
      context.fillRect(bucket.x - radius, bucket.y - radius, radius * 2, radius * 2);
    });
  };
  overlay.onRemove = function onRemove() { canvas?.remove(); canvas = undefined; };
  overlay.setMap(map);
  return overlay;
}

let mapsPromise;
const CALLBACK_NAME = '__pokedexAtlasMapsReady';
const SCRIPT_ID = 'pokedex-atlas-google-maps';
const MAPS_TIMEOUT_MS = 15000;

export function loadGoogleMaps(key) {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (!key) return Promise.reject(new Error('Google Maps is not configured. Add REACT_APP_GOOGLE_MAPS_API_KEY to frontend/.env.local.'));
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    let settled = false;
    let timeout;
    let interval;
    const cleanup = () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      delete window[CALLBACK_NAME];
    };
    const succeed = () => {
      if (settled || !window.google?.maps?.Map) return;
      settled = true;
      cleanup();
      resolve(window.google);
    };
    const fail = (message) => {
      if (settled) return;
      settled = true;
      cleanup();
      mapsPromise = undefined;
      reject(new Error(message));
    };
    window[CALLBACK_NAME] = succeed;
    const existing = document.getElementById(SCRIPT_ID);
    interval = window.setInterval(succeed, 50);
    timeout = window.setTimeout(() => fail('Google Maps did not initialize. Check the Maps JavaScript API, billing, and key restrictions.'), MAPS_TIMEOUT_MS);
    if (!existing) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=${CALLBACK_NAME}`;
      script.async = true;
      script.onerror = () => fail('Google Maps could not load. Check the key restrictions and network connection.');
      document.head.appendChild(script);
    }
  });
  return mapsPromise;
}
