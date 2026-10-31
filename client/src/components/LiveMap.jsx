// client/src/components/LiveMap.jsx
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Crosshair, Compass, Maximize2, LocateFixed } from "lucide-react";

const MAP_STYLES = {
  google_dark: {
    name: "Dark",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    darkFilter: true
  },
  google_streets: {
    name: "Streets",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    darkFilter: false
  },
  google_hybrid: {
    name: "Satellite",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Satellite",
    darkFilter: false
  }
};

export default function LiveMap({
  route,
  telemetry,
  myCoords,
  focusedStop,
  homeStopNo,
  darkMode,
  onUserDragLocation
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const dynamicLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const lastFittedRouteNoRef = useRef(null);

  const [mapStyleKey, setMapStyleKey] = useState("google_dark");
  const [showStopLabels, setShowStopLabels] = useState(true);

  useEffect(() => {
    setMapStyleKey((prev) => {
      if (prev === "google_hybrid") return prev;
      return darkMode ? "google_dark" : "google_streets";
    });
  }, [darkMode]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [10.9522, 78.7517],
      zoom: 12,
      zoomControl: false
    });

    routeLayerRef.current = L.layerGroup().addTo(map);
    dynamicLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    setTimeout(() => map.invalidateSize(), 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const style = MAP_STYLES[mapStyleKey] || MAP_STYLES.google_dark;
    tileLayerRef.current = L.tileLayer(style.url, {
      attribution: style.attribution,
      maxZoom: 20
    }).addTo(map);
  }, [mapStyleKey]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusedStop) return;
    map.flyTo([focusedStop.lat, focusedStop.lng], 15, { duration: 0.75 });
  }, [focusedStop]);

  // Draw Route Polylines & Stops
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = routeLayerRef.current;
    if (!map || !group || !route) return;

    group.clearLayers();
    const activePathId =
      telemetry?.started && telemetry?.activePathId
        ? telemetry.activePathId
        : "path_a";

    route.validPaths.forEach((path) => {
      const isActive = path.pathId === activePathId;
      L.polyline(path.coordinates, {
        color: isActive ? "#38bdf8" : "#64748b",
        weight: isActive ? 5 : 2.5,
        opacity: isActive ? 0.9 : 0.3,
        dashArray: isActive ? null : "5, 7"
      }).addTo(group);
    });

    route.stops.forEach((stop, index) => {
      const isCampus = index === route.stops.length - 1;
      const isHome = Number(homeStopNo) === stop.stopNo;

      const markerHtml = `
        <div style="
          width: ${isCampus || isHome ? "24px" : "20px"};
          height: ${isCampus || isHome ? "24px" : "20px"};
          border-radius: 9999px;
          background: ${
            isCampus ? "#10b981" : isHome ? "#f59e0b" : "#1e293b"
          };
          border: 2px solid ${
            isCampus ? "#d1fae5" : isHome ? "#fef3c7" : "#94a3b8"
          };
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.45);
        ">
          ${isCampus ? "SRM" : stop.stopNo}
        </div>
      `;

      const stopIcon = L.divIcon({
        className: "",
        html: markerHtml,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon }).bindPopup(
        `<div style="font-family:sans-serif;color:#0f172a;min-width:145px">
          <div style="font-size:10px;font-weight:700;color:#64748b">BUS #${route.routeNo} • STOP #${stop.stopNo}</div>
          <div style="font-size:12px;font-weight:800;margin:2px 0">${stop.name}</div>
          <div style="font-size:11px;color:#475569">Scheduled: <strong>${stop.morningTime}</strong></div>
        </div>`
      );

      if (showStopLabels) {
        marker.bindTooltip(`${stop.name}`, {
          permanent: true,
          direction: "right",
          offset: [9, 0],
          className: "orbit-stop-label"
        });
      }

      marker.addTo(group);
    });

    if (lastFittedRouteNoRef.current !== route.routeNo) {
      lastFittedRouteNoRef.current = route.routeNo;
      const bounds = L.latLngBounds(route.stops.map((s) => [s.lat, s.lng]));
      if (myCoords?.lat && myCoords?.lng) {
        bounds.extend([myCoords.lat, myCoords.lng]);
      }
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [route, telemetry?.activePathId, telemetry?.started, showStopLabels, homeStopNo, myCoords]);

  // Render ALWAYS-VISIBLE "📍 YOU" Current Location Pin + Live Bus Pin
  useEffect(() => {
    const dynGroup = dynamicLayerRef.current;
    if (!dynGroup) return;
    dynGroup.clearLayers();

    const userLat = myCoords?.lat ?? 10.9522;
    const userLng = myCoords?.lng ?? 78.7517;

    // 1. Pulsing Radar Halo around User's Current Location
    L.circle([userLat, userLng], {
      radius: 60,
      color: "#0ea5e9",
      fillColor: "#38bdf8",
      fillOpacity: 0.22,
      weight: 2
    }).addTo(dynGroup);

    // 2. High-Contrast "📍 YOU" Current Location Pin (zIndexOffset: 5000 so it is always on top!)
    const userHtml = `
      <div class="orbit-bus-marker" style="
        padding: 0 10px;
        height: 28px;
        border-radius: 9999px;
        background: linear-gradient(135deg, #0284c7, #2563eb);
        border: 2.5px solid #ffffff;
        color: #ffffff;
        font-size: 10px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        white-space: nowrap;
        box-shadow: 0 4px 14px rgba(2,132,199,0.95);
        cursor: grab;
      ">
        <span style="width:7px;height:7px;border-radius:9999px;background:#38bdf8;border:1.5px solid #fff;display:inline-block"></span>
        <span>📍 YOU</span>
      </div>
    `;

    const userIcon = L.divIcon({
      className: "",
      html: userHtml,
      iconSize: [68, 28],
      iconAnchor: [34, 34] // Positioned cleanly above stop dots so it never gets covered
    });

    const uMarker = L.marker([userLat, userLng], {
      icon: userIcon,
      draggable: true,
      zIndexOffset: 5000
    })
      .bindPopup(
        `<div style="font-family:sans-serif;color:#0f172a;min-width:160px">
          <strong style="color:#0284c7">📍 Your Current Location</strong><br/>
          <span style="font-size:11px">Coords: ${userLat.toFixed(5)}, ${userLng.toFixed(5)}</span><br/>
          <span style="font-size:10px;color:#475569">Drag this pin to adjust if indoor Wi-Fi drifts</span>
        </div>`
      )
      .addTo(dynGroup);

    uMarker.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      if (onUserDragLocation) {
        onUserDragLocation({
          lat: Number(pos.lat.toFixed(6)),
          lng: Number(pos.lng.toFixed(6))
        });
      }
    });

    userMarkerRef.current = uMarker;

    // 3. Live Bus Marker (Only when bus has started)
    if (telemetry && telemetry.started) {
      const busHtml = `
        <div class="orbit-bus-marker" style="
          padding: 0 11px;
          height: 34px;
          border-radius: 9999px;
          background: #0f172a;
          border: 2.5px solid #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          color: #f8fafc;
          font-weight: 800;
          font-size: 11px;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(0,0,0,0.65);
        ">
          <span style="width:7px;height:7px;border-radius:9999px;background:#10b981;display:inline-block"></span>
          <span>BUS #${String(telemetry.routeNo).padStart(2, "0")}</span>
        </div>
      `;

      const busIcon = L.divIcon({
        className: "",
        html: busHtml,
        iconSize: [86, 34],
        iconAnchor: [43, 10]
      });

      L.marker([telemetry.lat, telemetry.lng], {
        icon: busIcon,
        zIndexOffset: 3000
      })
        .bindPopup(
          `<div style="font-family:sans-serif;color:#0f172a">
            <strong>BUS #${String(telemetry.routeNo).padStart(2, "0")} LIVE</strong><br/>
            <span>Speed: ${telemetry.speedKmh} km/h</span><br/>
            <span>Current Stop: ${telemetry.currentStopName}</span>
          </div>`
        )
        .addTo(dynGroup);
    }
  }, [telemetry, myCoords, onUserDragLocation]);

  function handleTopViewRoute() {
    const map = mapInstanceRef.current;
    if (!map || !route) return;
    const bounds = L.latLngBounds(route.stops.map((s) => [s.lat, s.lng]));
    if (myCoords?.lat && myCoords?.lng) {
      bounds.extend([myCoords.lat, myCoords.lng]);
    }
    map.flyToBounds(bounds, { padding: [42, 42], duration: 0.8 });
  }

  function handleFocusBus() {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (telemetry && telemetry.started) {
      map.flyTo([telemetry.lat, telemetry.lng], 15, { duration: 0.75 });
    } else {
      handleTopViewRoute();
    }
  }

  function handleFocusMyLocation() {
    const map = mapInstanceRef.current;
    if (!map) return;
    const uLat = myCoords?.lat ?? 10.9522;
    const uLng = myCoords?.lng ?? 78.7517;
    map.flyTo([uLat, uLng], 15, { duration: 0.75 });
    setTimeout(() => {
      userMarkerRef.current?.openPopup();
    }, 600);
  }

  const currentStyle = MAP_STYLES[mapStyleKey] || MAP_STYLES.google_dark;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${
        currentStyle.darkFilter ? "orbit-dark-osm-tiles" : ""
      }`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top-Left Live Status Pill */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl backdrop-blur-xl bg-slate-900/85 text-slate-100 border border-white/10 shadow-lg text-[11px] font-semibold flex items-center gap-2">
          {telemetry && telemetry.started ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                Bus #{String(telemetry.routeNo).padStart(2, "0")} Live •{" "}
                {telemetry.currentStopName}
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-300">
                Bus #{String(route?.routeNo || 1).padStart(2, "0")} Not Started Yet
              </span>
            </>
          )}
        </div>
      </div>

      {/* Top-Right Map Layer & Location Controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-wrap items-center justify-end gap-1.5">
        <div className="flex items-center backdrop-blur-xl bg-slate-900/85 text-slate-200 rounded-xl p-1 border border-white/10 shadow-lg text-[11px] font-semibold">
          {Object.entries(MAP_STYLES).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setMapStyleKey(key)}
              className={`px-2 py-1 rounded-lg transition ${
                mapStyleKey === key
                  ? "bg-slate-700/90 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Dedicated "My Location" Button */}
        <button
          onClick={handleFocusMyLocation}
          title="Zoom to Your Current Location (📍 YOU)"
          className="px-2.5 py-2 rounded-xl backdrop-blur-xl bg-sky-600/90 hover:bg-sky-500 text-white border border-sky-400/40 shadow-lg transition flex items-center gap-1 text-[11px] font-bold"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          <span>My Location</span>
        </button>

        <button
          onClick={handleTopViewRoute}
          title="Top View (Full Route Overview)"
          className="px-2.5 py-2 rounded-xl backdrop-blur-xl bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-white/10 shadow-lg transition flex items-center gap-1 text-[11px] font-semibold"
        >
          <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Top View</span>
        </button>

        <button
          onClick={() => setShowStopLabels((v) => !v)}
          title="Toggle Stop Labels"
          className={`p-2 rounded-xl backdrop-blur-xl border shadow-lg transition ${
            showStopLabels
              ? "bg-slate-800/90 text-sky-400 border-sky-500/40"
              : "bg-slate-900/80 text-slate-400 border-white/10"
          }`}
        >
          <Compass className="w-4 h-4" />
        </button>

        <button
          onClick={handleFocusBus}
          title="Zoom to Live Bus"
          className="p-2 rounded-xl backdrop-blur-xl bg-slate-900/85 hover:bg-slate-800 text-emerald-400 border border-white/10 shadow-lg transition"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}