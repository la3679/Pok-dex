import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiBaseUrl from "../api";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorBanner, PokeballLoader } from "../components/ui/States";
import { TypeBadge } from "../components/ui/TypeBadge";
import {
  clusterSightings,
  createHeatmapOverlay,
  loadGoogleMaps,
} from "../lib/map";
import { useProfile } from "../context/ProfileContext";

const mapsKey =
  import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Unknown date";

export default function SightingsMapPage() {
  const { pokemonId } = useParams();
  const { recordMapVisit } = useProfile();
  const registeredVisit = useRef(false);
  const mapNode = useRef(null);
  const mapInstance = useRef(null);
  const mapsApi = useRef(null);
  const markers = useRef([]);
  const heatmap = useRef(null);
  const radiusCircle = useRef(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [radius, setRadius] = useState(25);
  const [position, setPosition] = useState(null);
  const [radiusEnabled, setRadiusEnabled] = useState(false);
  const [mode, setMode] = useState("clusters");
  const [selected, setSelected] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [mapError, setMapError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const pokemon = useQuery({
    queryKey: ["map-pokemon", pokemonId],
    queryFn: async () =>
      (await axios.get(`${apiBaseUrl}/pokemon/${pokemonId}`)).data,
    enabled: Boolean(pokemonId),
  });
  const params = {
    pokemonId: pokemonId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    latitude: radiusEnabled ? position?.lat : undefined,
    longitude: radiusEnabled ? position?.lng : undefined,
    radius: radiusEnabled ? radius : undefined,
    limit: 1000,
  };
  const sightings = useQuery({
    queryKey: ["map-sightings", params],
    queryFn: async () =>
      (await axios.get(`${apiBaseUrl}/sightings`, { params })).data,
  });
  const points = sightings.data?.sightings || [];
  const clusters = useMemo(() => clusterSightings(points), [points]);
  const hotspot = clusters.slice().sort((a, b) => b.count - a.count)[0];
  const title = pokemonId
    ? `${pokemon.data?.pokemon?.name || "Pokémon"} sightings`
    : "Sightings map";
  useEffect(() => {
    if (!registeredVisit.current) {
      registeredVisit.current = true;
      recordMapVisit();
    }
  }, [recordMapVisit]);
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setMapError("This browser does not support location access.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude });
        setRadiusEnabled(true);
        setMapError("");
      },
      () =>
        setMapError(
          "Location access was unavailable. You can continue exploring the global dataset.",
        ),
    );
  };
  // Re-run when the data view appears so the map initializes against a real,
  // mounted container — the map div is absent while the loader/error shows,
  // which is why a one-shot mount effect left the first load blank.
  const containerVisible = !sightings.isLoading && !sightings.isError;
  useEffect(() => {
    if (!containerVisible) return undefined;
    let cancelled = false;
    let observer;
    const timers = [];

    // The map container is laid out inside an animated (scale/opacity) route
    // wrapper. Creating the map before the container has real dimensions — or
    // while the entrance transform is mid-flight — leaves tiles blank until a
    // resize. Wait for a measurable container, then nudge after it settles.
    const waitForContainer = () =>
      new Promise((resolve) => {
        const check = (attempt = 0) => {
          if (cancelled) return resolve(false);
          const node = mapNode.current;
          if (node && node.offsetWidth > 0 && node.offsetHeight > 0) return resolve(true);
          if (attempt > 90) return resolve(false); // ~1.5s safety cap
          return window.requestAnimationFrame(() => check(attempt + 1));
        };
        check();
      });

    loadGoogleMaps(mapsKey)
      .then(async (google) => {
        const ready = await waitForContainer();
        if (cancelled || !ready || !mapNode.current) return;
        mapsApi.current = google;
        // Recreate the map if it is missing or bound to a stale container node
        // (e.g. a StrictMode remount swaps in a fresh DOM node), otherwise the
        // visible container stays empty while the map lives in a detached node.
        if (!mapInstance.current || mapInstance.current.getDiv() !== mapNode.current) {
          mapInstance.current = new google.maps.Map(mapNode.current, {
            center: position || { lat: 20, lng: 0 },
            zoom: position ? 7 : 2,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
        }

        // Re-fit the map to its container so first-load tiles fill the area
        // instead of rendering blank. Repeat across the transition window.
        const nudge = () => {
          const map = mapInstance.current;
          if (cancelled || !map) return;
          const center = map.getCenter();
          google.maps.event.trigger(map, "resize");
          if (center) map.setCenter(center);
        };
        [60, 350, 700].forEach((delay) => timers.push(window.setTimeout(nudge, delay)));
        if (typeof ResizeObserver !== "undefined" && mapNode.current) {
          observer = new ResizeObserver(() => nudge());
          observer.observe(mapNode.current);
        }

        setMapReady(true);
      })
      .catch((error) => !cancelled && setMapError(error.message));

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      observer?.disconnect();
      markers.current.forEach((marker) => marker.setMap(null));
      markers.current = [];
      heatmap.current?.setMap(null);
      heatmap.current = null;
      radiusCircle.current?.setMap(null);
      radiusCircle.current = null;
    };
  }, [containerVisible]);
  useEffect(() => {
    const google = mapsApi.current;
    const map = mapInstance.current;
    if (!mapReady || !google?.maps || !map || !points.length) return;
    try {
      markers.current.forEach((marker) => marker.setMap(null));
      markers.current = [];
      if (heatmap.current) {
        heatmap.current.setMap(null);
        heatmap.current = null;
      }
      if (radiusCircle.current) {
        radiusCircle.current.setMap(null);
        radiusCircle.current = null;
      }
      const center = position || {
        lat: points[0].location.coordinates[1],
        lng: points[0].location.coordinates[0],
      };
      map.setCenter(center);
      if (position) map.setZoom(7);
      if (radiusEnabled && position)
        radiusCircle.current = new google.maps.Circle({
          map,
          center: position,
          radius: radius * 1000,
          strokeColor: "#ee4945",
          strokeWeight: 2,
          fillColor: "#ee4945",
          fillOpacity: 0.08,
        });
      if (mode === "heatmap") {
        heatmap.current = createHeatmapOverlay(google, map, points);
        setMapError((current) =>
          current.startsWith("Unable to render") ? "" : current,
        );
        return;
      }
      const display =
        mode === "clusters"
          ? clusters
          : points.map((point) => ({
              lat: point.location.coordinates[1],
              lng: point.location.coordinates[0],
              count: 1,
              sightings: [point],
            }));
      display.forEach((group) => {
        const marker = new google.maps.Marker({
          map,
          position: { lat: group.lat, lng: group.lng },
          label: group.count > 1 ? String(group.count) : "",
          title:
            group.count > 1
              ? `${group.count} sightings`
              : group.sightings[0].pokemon_name,
          icon:
            group.count > 1
              ? undefined
              : {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillColor: "#ee4945",
                  fillOpacity: 1,
                  strokeColor: "#fff",
                  strokeWeight: 2,
                },
        });
        marker.addListener("click", () => {
          const item = group.sightings[0];
          setSelected(item);
          map.panTo({ lat: group.lat, lng: group.lng });
          map.setZoom(group.count > 1 ? 6 : 12);
        });
        markers.current.push(marker);
      });
      setMapError((current) =>
        current.startsWith("Unable to render") ? "" : current,
      );
    } catch (error) {
      setMapError(
        `Unable to render ${mode} mode. ${error.message || "Try another map mode."}`,
      );
    }
  }, [points, clusters, mapReady, mode, position, radius, radiusEnabled]);
  const focus = (item) => {
    setSelected(item);
    const [lng, lat] = item.location.coordinates;
    mapInstance.current?.panTo({ lat, lng });
    mapInstance.current?.setZoom(12);
  };
  if (sightings.isLoading)
    return <PokeballLoader label="Scanning sightings data…" />;
  if (sightings.isError)
    return (
      <ErrorBanner
        title="Sightings could not load"
        message={
          sightings.error?.response?.data?.error?.message ||
          "Check that the local API is running."
        }
        onRetry={sightings.refetch}
      />
    );
  // Guard against an unexpected/missing payload shape so the page never
  // white-screens; the map, controls, and sidebar still render.
  const summary = sightings.data?.summary ?? {
    total: points.length,
    visible: points.length,
    latest_date: null,
  };
  return (
    <div
      className={`pokedex-screen sightings-page ${fullScreen ? "sightings-page--fullscreen" : ""}`}
    >
      <div className="boot-screen__scanlines" />
      <PageHeader
        eyebrow="Exploration"
        title={title}
        description="Filter the canonical sightings dataset by time and radius, then switch between clustered markers and a heatmap."
        actions={
          <button
            className="button button--quiet"
            onClick={() => setFullScreen(!fullScreen)}
          >
            {fullScreen ? "Exit fullscreen" : "Fullscreen map"}
          </button>
        }
      />
      <section className="map-controls terminal-panel">
        <label>
          From
          <input
            type="date"
            className="terminal-input"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            className="terminal-input"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </label>
        <label className="radius-control">
          Radius{" "}
          <input
            type="range"
            min="1"
            max="200"
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
            disabled={!radiusEnabled}
          />
          <span className="terminal-text">{radius} km</span>
        </label>
        <button
          className={`button ${radiusEnabled ? "button--primary" : "button--quiet"}`}
          onClick={requestLocation}
        >
          {radiusEnabled ? "Location active" : "Use my location"}
        </button>
        <button
          className={`map-mode ${mode === "clusters" ? "is-active" : ""}`}
          onClick={() => setMode("clusters")}
        >
          Clusters
        </button>
        <button
          className={`map-mode ${mode === "markers" ? "is-active" : ""}`}
          onClick={() => setMode("markers")}
        >
          Markers
        </button>
        <button
          className={`map-mode ${mode === "heatmap" ? "is-active" : ""}`}
          onClick={() => setMode("heatmap")}
        >
          Heatmap
        </button>
      </section>
      {mapError && <ErrorBanner title="Map display note" message={mapError} />}
      <section className="sighting-summary">
        <article className="terminal-panel">
          <small>Total matching</small>
          <strong className="sys-prompt">{summary.total.toLocaleString()}</strong>
        </article>
        <article className="terminal-panel">
          <small>Visible on map</small>
          <strong className="sys-prompt">{summary.visible.toLocaleString()}</strong>
        </article>
        <article className="terminal-panel">
          <small>Latest sighting</small>
          <strong className="sys-prompt">{formatDate(summary.latest_date)}</strong>
        </article>
        <article className="terminal-panel">
          <small>Top hotspot</small>
          <strong className="sys-prompt">{hotspot ? `${hotspot.count} points` : "—"}</strong>
        </article>
      </section>
      <div className="map-layout terminal-panel">
        <section className="map-stage" style={{ position: "relative", overflow: "hidden" }}>
          <div className="boot-screen__radar" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "200%", height: "200%" }} />
          <div
            ref={mapNode}
            className="google-map"
            style={{ position: "relative", zIndex: 2, mixBlendMode: mode === "heatmap" ? "screen" : "normal" }}
            aria-label="Google Maps sightings map"
          />
          {!mapsKey && (
            <div className="map-fallback" style={{ zIndex: 3 }}>
              <strong>Google Maps key is not configured</strong>
              <span>
                Add REACT_APP_GOOGLE_MAPS_API_KEY to frontend/.env.local to enable
                the map. The sightings list, filters, and controls still work.
              </span>
            </div>
          )}
          {mapsKey && mapError && !mapReady && (
            <div className="map-fallback map-fallback--error" style={{ zIndex: 3 }}>
              <strong>Map could not initialize</strong>
              <span>{mapError} The sightings list and filters still work.</span>
            </div>
          )}
          {mapsKey && !mapReady && !mapError && (
            <div className="map-loading" style={{ zIndex: 3 }} role="status" aria-live="polite">
              <span className="map-loading__spinner" aria-hidden="true" />
              <span className="terminal-text">Initializing map…</span>
            </div>
          )}
        </section>
        <aside className="sighting-sidebar">
          <div>
            <h2 className="sys-prompt">Visible sightings</h2>
            <span className="terminal-text">{points.length} loaded</span>
          </div>
          {points.slice(0, 80).map((item) => (
            <button
              key={item.id}
              className={selected?.id === item.id ? "is-selected" : ""}
              onClick={() => focus(item)}
            >
              {item.image_url && <img src={item.image_url} alt="" />}
              <span>
                <strong style={{ fontFamily: '"DM Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.pokemon_name}</strong>
                <small className="terminal-text">{formatDate(item.date)}</small>
                <i>
                  {item.types.map((type) => (
                    <TypeBadge key={type} type={type} compact />
                  ))}
                </i>
              </span>
            </button>
          ))}
          {!points.length && <p className="terminal-text" style={{ padding: '1rem' }}>No sightings match the current filters.</p>}
        </aside>
      </div>
    </div>
  );
}
