// server/src/index.js
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { SRM_ROUTES, SRM_CAMPUS } from "./data/srmRoutes.js";

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 15000,
  pingInterval: 8000
});

// ============================================================================
// 1. REAL TRICHY ROAD POLYLINE SYNC (OSRM)
// ============================================================================
async function hydrateRealRoadPaths() {
  console.log("🗺️  Syncing real Trichy road geometries from OSRM...");
  for (const route of SRM_ROUTES) {
    try {
      const firstStop = route.stops[0];
      const midStop = route.stops[Math.floor(route.stops.length / 2)];
      const campusStop = route.stops[route.stops.length - 1];

      const coordsQuery = `${firstStop.lng},${firstStop.lat};${midStop.lng},${midStop.lat};${campusStop.lng},${campusStop.lat}`;
      const url = `https://router.project-osrm.org/route/v1/driving/${coordsQuery}?alternatives=true&overview=full&geometries=geojson`;

      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        data.routes.forEach((osrmRoute, idx) => {
          const latLngs = osrmRoute.geometry.coordinates.map(([lng, lat]) => [
            Number(lat.toFixed(6)),
            Number(lng.toFixed(6))
          ]);
          if (route.validPaths[idx] && latLngs.length > 2) {
            route.validPaths[idx].coordinates = latLngs;
          }
        });

        const primaryRoad = route.validPaths[0].coordinates;
        route.stops.forEach((stop, sIdx) => {
          if (sIdx === 0 || sIdx === route.stops.length - 1) return;
          const roadIdx = Math.min(
            primaryRoad.length - 1,
            Math.round((sIdx / (route.stops.length - 1)) * (primaryRoad.length - 1))
          );
          stop.lat = primaryRoad[roadIdx][0];
          stop.lng = primaryRoad[roadIdx][1];
        });
      }
    } catch {
      // Fallback to default curve coordinates if offline
    }
  }
  console.log("✅ All 31 SRM Trichy Bus Routes ready.");
}

hydrateRealRoadPaths();

// ============================================================================
// 2. IST TIME HELPER (Up to 12:00 PM = Morning to SRM, After 12:00 PM = Evening to Home)
// ============================================================================
function isMorningCommuteIST() {
  const istHourStr = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "numeric"
  });
  const istHour = Number(istHourStr);
  return istHour < 12; // 00:00 to 11:59 AM is Morning (To SRM Trichy); 12:00 PM+ is Evening (To Home Stop)
}

// ============================================================================
// 3. IN-MEMORY PRODUCTION STORE
// ============================================================================
const activeRouteSharers = new Map(); // Map<routeNo, Map<userId, SharerSession>>
const smoothedBusStates = new Map();  // Map<routeNo, BusTelemetry>

const MAX_ROUTE_CORRIDOR_METERS = 500;
const MAX_BUS_DIVERGENCE_METERS = 400;
const PING_TTL_MS = 12000;
const MIN_USER_PING_INTERVAL_MS = 900;

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function closestPointOnSegment(pLat, pLng, aLat, aLng, bLat, bLng) {
  const dx = bLat - aLat;
  const dy = bLng - aLng;
  if (dx === 0 && dy === 0) {
    return {
      lat: aLat,
      lng: aLng,
      distMeters: getDistanceMeters(pLat, pLng, aLat, aLng)
    };
  }
  let t = ((pLat - aLat) * dx + (pLng - aLng) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  const projLat = aLat + t * dx;
  const projLng = aLng + t * dy;
  return {
    lat: projLat,
    lng: projLng,
    distMeters: getDistanceMeters(pLat, pLng, projLat, projLng)
  };
}

function validateAgainstRoutePaths(route, lat, lng) {
  let bestMatch = {
    isValid: false,
    minDistanceMeters: Infinity,
    matchedPathId: route.validPaths[0].pathId,
    matchedPathName: route.validPaths[0].name,
    snappedLat: lat,
    snappedLng: lng
  };

  for (const path of route.validPaths) {
    const coords = path.coordinates;
    for (let i = 0; i < coords.length - 1; i++) {
      const [aLat, aLng] = coords[i];
      const [bLat, bLng] = coords[i + 1];
      const proj = closestPointOnSegment(lat, lng, aLat, aLng, bLat, bLng);
      if (proj.distMeters < bestMatch.minDistanceMeters) {
        bestMatch = {
          isValid: proj.distMeters <= MAX_ROUTE_CORRIDOR_METERS,
          minDistanceMeters: Number(proj.distMeters.toFixed(1)),
          matchedPathId: path.pathId,
          matchedPathName: path.name,
          snappedLat: proj.lat,
          snappedLng: proj.lng
        };
      }
    }
  }
  return bestMatch;
}

// 12:00 PM Rule Destination Cutoff:
// - Up to 12:00 PM: Cuts off when student arrives at SRM Trichy Campus (<=350m)
// - After 12:00 PM: Cuts off when student arrives at their chosen Home Stop (<=300m)
function checkTimeBasedDestinationCutoff(route, homeStopNo, currentLat, currentLng) {
  const isMorning = isMorningCommuteIST();

  if (isMorning) {
    const distToCampus = getDistanceMeters(
      currentLat,
      currentLng,
      SRM_CAMPUS.lat,
      SRM_CAMPUS.lng
    );
    if (distToCampus <= SRM_CAMPUS.autoOffRadiusMeters) {
      return {
        reached: true,
        destinationName: "SRM Trichy Campus"
      };
    }
  } else {
    const homeStop =
      route.stops.find((s) => s.stopNo === Number(homeStopNo)) || route.stops[0];
    const distToHome = getDistanceMeters(
      currentLat,
      currentLng,
      homeStop.lat,
      homeStop.lng
    );
    if (distToHome <= 300) {
      return {
        reached: true,
        destinationName: homeStop.name
      };
    }
  }

  return { reached: false };
}

// ============================================================================
// 4. SINGLE-PRIMARY SELECTION ENGINE (1-Second Check, Nearest to Route Wins)
// ============================================================================
function computeBestBusTelemetry(routeNo) {
  const route = SRM_ROUTES.find((r) => r.routeNo === Number(routeNo));
  if (!route) return null;

  const isMorning = isMorningCommuteIST();
  const sharerMap = activeRouteSharers.get(route.routeNo);
  if (!sharerMap || sharerMap.size === 0) {
    smoothedBusStates.delete(route.routeNo);
    return null;
  }

  const now = Date.now();
  const activeCandidates = [];

  for (const [uid, ping] of sharerMap.entries()) {
    if (now - ping.timestamp > PING_TTL_MS) {
      sharerMap.delete(uid);
    } else if (ping.accuracy <= 180) {
      activeCandidates.push(ping);
    }
  }

  if (activeCandidates.length === 0) {
    smoothedBusStates.delete(route.routeNo);
    return null;
  }

  // Prioritize moving devices on the bus over stationary devices
  const movingCandidates = activeCandidates.filter((c) => c.speedKmh >= 8);
  const pool = movingCandidates.length > 0 ? movingCandidates : activeCandidates;

  // Sort strictly by shortest perpendicular distance to the actual route path
  pool.sort((a, b) => {
    if (Math.abs(a.distanceToRouteMeters - b.distanceToRouteMeters) > 1.5) {
      return a.distanceToRouteMeters - b.distanceToRouteMeters;
    }
    return a.accuracy - b.accuracy;
  });

  // Pick ONLY the single best device (never disclosed to any user)
  const primaryDevice = pool[0];

  let finalLat = primaryDevice.snappedLat * 0.85 + primaryDevice.lat * 0.15;
  let finalLng = primaryDevice.snappedLng * 0.85 + primaryDevice.lng * 0.15;
  let liveSpeedKmh = Math.round(primaryDevice.speedKmh || 0);

  const prevState = smoothedBusStates.get(route.routeNo);
  if (prevState && now - prevState.timestamp < 6000) {
    const alpha = 0.72;
    finalLat = alpha * finalLat + (1 - alpha) * prevState.lat;
    finalLng = alpha * finalLng + (1 - alpha) * prevState.lng;
    liveSpeedKmh = Math.round(
      alpha * liveSpeedKmh + (1 - alpha) * prevState.speedKmh
    );
  }

  let closestStopIdx = 0;
  let minStopDist = Infinity;
  route.stops.forEach((stop, idx) => {
    const d = getDistanceMeters(finalLat, finalLng, stop.lat, stop.lng);
    if (d < minStopDist) {
      minStopDist = d;
      closestStopIdx = idx;
    }
  });

  const effectiveSpeedForEta = Math.max(22, liveSpeedKmh);

  const stopEtas = route.stops.map((stop, idx) => {
    const distMeters = getDistanceMeters(finalLat, finalLng, stop.lat, stop.lng);
    const etaMinutes = Math.max(
      1,
      Math.round((distMeters / 1000 / effectiveSpeedForEta) * 60)
    );
    // Morning (<12 PM): Bus goes Stop 1 -> SRM Campus (idx < closestStopIdx is passed)
    // Evening (>=12 PM): Bus goes SRM Campus -> Stop 1 (idx > closestStopIdx is passed)
    const passed = isMorning ? idx < closestStopIdx : idx > closestStopIdx;
    return {
      stopNo: stop.stopNo,
      stopName: stop.name,
      scheduledTime: stop.morningTime,
      distanceKm: Number((distMeters / 1000).toFixed(2)),
      etaMinutes,
      passed
    };
  });

  const nextStopIdx = isMorning
    ? Math.min(route.stops.length - 1, closestStopIdx + 1)
    : Math.max(0, closestStopIdx - 1);

  const routeTerminalStopIdx = isMorning ? route.stops.length - 1 : 0;

  const currentStopObj = route.stops[closestStopIdx] || route.stops[0];
  const nextStopObj =
    route.stops[nextStopIdx] || route.stops[route.stops.length - 1];
  const routeTerminalStopObj =
    route.stops[routeTerminalStopIdx] || route.stops[route.stops.length - 1];

  const nextStopEtaObj = stopEtas[nextStopIdx];
  const routeTerminalEtaObj = stopEtas[routeTerminalStopIdx];

  const progressPct = isMorning
    ? Math.min(
        100,
        Math.max(
          4,
          Math.round(
            (closestStopIdx / Math.max(1, route.stops.length - 1)) * 100
          )
        )
      )
    : Math.min(
        100,
        Math.max(
          4,
          Math.round(
            ((route.stops.length - 1 - closestStopIdx) /
              Math.max(1, route.stops.length - 1)) *
              100
          )
        )
      );

  const state = {
    routeNo: route.routeNo,
    started: true,
    isMorning,
    lat: Number(finalLat.toFixed(6)),
    lng: Number(finalLng.toFixed(6)),
    speedKmh: liveSpeedKmh,
    activePathId: primaryDevice.matchedPathId,
    activePathName: primaryDevice.matchedPathName,
    currentStopIndex: closestStopIdx,
    currentStopNo: currentStopObj.stopNo,
    currentStopName: currentStopObj.name,
    currentStopScheduledTime: currentStopObj.morningTime,
    nextStopNo: nextStopObj.stopNo,
    nextStopName: nextStopObj.name,
    nextStopScheduledTime: nextStopObj.morningTime,
    nextStopEtaMinutes: nextStopEtaObj ? nextStopEtaObj.etaMinutes : 1,
    nextStopDistanceKm: nextStopEtaObj ? nextStopEtaObj.distanceKm : 0,
    routeTerminalName: routeTerminalStopObj.name,
    routeTerminalScheduledTime: isMorning
      ? route.morningCampusArrival
      : route.eveningCampusDeparture,
    routeTerminalEtaMinutes: routeTerminalEtaObj
      ? routeTerminalEtaObj.etaMinutes
      : 1,
    routeTerminalDistanceKm: routeTerminalEtaObj
      ? routeTerminalEtaObj.distanceKm
      : 0,
    progressPct,
    stopEtas,
    timestamp: now
  };

  smoothedBusStates.set(route.routeNo, state);
  return state;
}

// ============================================================================
// 5. HTTP ENDPOINTS
// ============================================================================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    isMorningIST: isMorningCommuteIST(),
    activeBuses: smoothedBusStates.size
  });
});

app.get("/api/routes", (req, res) => {
  res.set("Cache-Control", "public, max-age=5");
  const isMorning = isMorningCommuteIST();
  const summary = SRM_ROUTES.map((r) => ({
    ...r,
    liveTelemetry: smoothedBusStates.get(r.routeNo) || null
  }));
  res.json({ campus: SRM_CAMPUS, isMorningIST: isMorning, routes: summary });
});

// ============================================================================
// 6. SOCKET.IO REALTIME ENGINE
// ============================================================================
io.on("connection", (socket) => {
  socket.on("join_route", ({ routeNo }) => {
    const rNo = Number(routeNo);
    socket.join(`room:bus_${rNo}`);
    const current = computeBestBusTelemetry(rNo);
    if (current) {
      socket.emit("bus_telemetry_update", current);
    } else {
      socket.emit("bus_telemetry_update", {
        routeNo: rNo,
        started: false,
        isMorning: isMorningCommuteIST()
      });
    }
  });

  socket.on("leave_route", ({ routeNo }) => {
    socket.leave(`room:bus_${Number(routeNo)}`);
  });

  socket.on("student_location_ping", (payload) => {
    const {
      routeNo,
      userId,
      lat,
      lng,
      accuracy = 10,
      speedKmh = 0,
      homeStopNo = 1
    } = payload;

    const route = SRM_ROUTES.find((r) => r.routeNo === Number(routeNo));
    if (!route || !userId) return;

    if (!activeRouteSharers.has(route.routeNo)) {
      activeRouteSharers.set(route.routeNo, new Map());
    }
    const sharerMap = activeRouteSharers.get(route.routeNo);
    const existing = sharerMap.get(userId);
    const now = Date.now();

    if (existing && now - existing.timestamp < MIN_USER_PING_INTERVAL_MS) {
      return;
    }

    const numLat = Number(lat);
    const numLng = Number(lng);

    // 1. Validate 500-meter radius from any point of any valid path of the route
    const validation = validateAgainstRoutePaths(route, numLat, numLng);
    if (!validation.isValid) {
      sharerMap.delete(userId);
      socket.emit("sharing_status", {
        status: "CUTOFF_OUT_OF_ROUTE",
        distanceMeters: Math.round(validation.minDistanceMeters),
        message: `Live location sharing paused — you are ${Math.round(
          validation.minDistanceMeters
        )}m away from Bus #${String(route.routeNo).padStart(
          2,
          "0"
        )}'s route (must be within 500m).`
      });
      return;
    }

    // 2. Anti-Prank Cutoff: Reject stationary pranksters or users >400m away from an active moving bus
    const currentBus = smoothedBusStates.get(route.routeNo);
    if (
      currentBus &&
      sharerMap.size >= 1 &&
      !sharerMap.has(userId) &&
      currentBus.speedKmh >= 12
    ) {
      const distFromLiveBus = getDistanceMeters(
        numLat,
        numLng,
        currentBus.lat,
        currentBus.lng
      );
      if (distFromLiveBus > MAX_BUS_DIVERGENCE_METERS && Number(speedKmh) < 5) {
        sharerMap.delete(userId);
        socket.emit("sharing_status", {
          status: "CUTOFF_AWAY_FROM_BUS",
          distanceMeters: Math.round(distFromLiveBus),
          message: `Location sharing stopped — your location is ${Math.round(
            distFromLiveBus
          )}m away from the moving bus.`
        });
        return;
      }
    }

    if (currentBus && sharerMap.size >= 2) {
      const distFromLiveBus = getDistanceMeters(
        numLat,
        numLng,
        currentBus.lat,
        currentBus.lng
      );
      if (distFromLiveBus > MAX_BUS_DIVERGENCE_METERS) {
        sharerMap.delete(userId);
        socket.emit("sharing_status", {
          status: "CUTOFF_AWAY_FROM_BUS",
          distanceMeters: Math.round(distFromLiveBus),
          message: `Location sharing automatically stopped — detected away from Bus #${String(
            route.routeNo
          ).padStart(2, "0")}.`
        });
        return;
      }
    }

    // Derive real speed from consecutive GPS coordinates if device speed is 0
    let computedSpeedKmh = Number(speedKmh) || 0;
    if (existing && computedSpeedKmh === 0) {
      const dtSeconds = Math.max(1, (now - existing.timestamp) / 1000);
      const movedMeters = getDistanceMeters(
        existing.lat,
        existing.lng,
        numLat,
        numLng
      );
      const derivedKmh = (movedMeters / dtSeconds) * 3.6;
      if (derivedKmh <= 110) {
        computedSpeedKmh = Math.round(derivedKmh);
      }
    }

    // 3. Check 12:00 PM Rule Destination Cutoff (Morning -> SRM Campus, Evening -> Student's Home Stop)
    const cutoff = checkTimeBasedDestinationCutoff(
      route,
      homeStopNo,
      numLat,
      numLng
    );
    if (cutoff.reached) {
      sharerMap.delete(userId);
      socket.emit("sharing_status", {
        status: "AUTO_STOPPED_DESTINATION",
        message: `Destination reached (${cutoff.destinationName}). Location sharing automatically turned off.`
      });
      return;
    }

    sharerMap.set(userId, {
      userId,
      socketId: socket.id,
      lat: numLat,
      lng: numLng,
      snappedLat: validation.snappedLat,
      snappedLng: validation.snappedLng,
      distanceToRouteMeters: validation.minDistanceMeters,
      matchedPathId: validation.matchedPathId,
      matchedPathName: validation.matchedPathName,
      accuracy: Number(accuracy) || 10,
      speedKmh: computedSpeedKmh,
      homeStopNo: Number(homeStopNo),
      timestamp: now
    });

    socket.emit("sharing_status", {
      status: "ACCEPTED_ACTIVE",
      message: `Sharing live location for Bus #${String(route.routeNo).padStart(
        2,
        "0"
      )}`
    });
  });

  socket.on("stop_sharing", ({ routeNo, userId }) => {
    const sharerMap = activeRouteSharers.get(Number(routeNo));
    if (sharerMap) sharerMap.delete(userId);
  });

  socket.on("disconnect", () => {
    for (const sharerMap of activeRouteSharers.values()) {
      for (const [uid, session] of sharerMap.entries()) {
        if (session.socketId === socket.id) {
          sharerMap.delete(uid);
        }
      }
    }
  });
});

// 1-Second Realtime Failover & Broadcast Loop
setInterval(() => {
  const isMorning = isMorningCommuteIST();
  const activeSummary = [];
  for (const route of SRM_ROUTES) {
    const telemetry = computeBestBusTelemetry(route.routeNo);
    if (telemetry) {
      io.to(`room:bus_${route.routeNo}`).emit("bus_telemetry_update", telemetry);
      activeSummary.push({
        routeNo: telemetry.routeNo,
        speedKmh: telemetry.speedKmh,
        currentStopName: telemetry.currentStopName
      });
    } else {
      io.to(`room:bus_${route.routeNo}`).emit("bus_telemetry_update", {
        routeNo: route.routeNo,
        started: false,
        isMorning
      });
    }
  }
  io.emit("active_buses_overview", activeSummary);
}, 1000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 OrbitLive Production Engine running on port ${PORT}`);
});