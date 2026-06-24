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

let mapsPromise;
export function loadGoogleMaps(key) {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (!key) return Promise.reject(new Error('Google Maps is not configured. Add REACT_APP_GOOGLE_MAPS_API_KEY to frontend/.env.local.'));
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=visualization`;
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Google Maps could not load. Check the key restrictions and network connection.'));
    document.head.appendChild(script);
  });
  return mapsPromise;
}
