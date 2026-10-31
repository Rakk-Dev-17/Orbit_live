// server/src/index.js
import express from "express";
import http from "http";
import cors from "cors";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { Server } from "socket.io";
import { SRM_ROUTES, SRM_CAMPUS } from "./data/srmRoutes.js";

const app = express();
const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : "*";

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "x-admin-token", "x-driver-token"]
  })
);
app.use(express.json({ limit: "256kb" }));

const server = http.createServer(app);

const io = new Server(server, {
  path: "/api/socket.io",
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  },
  pingTimeout: 15000,
  pingInterval: 8000,
  maxHttpBufferSize: 1e5
});

// ============================================================================
// 1. FREE CRYPTOGRAPHIC PASSWORD HASHING (scrypt + timingSafeEqual) & RATE LIMITER
// ============================================================================
const SERVER_SECRET =
  process.env.ORBIT_SECRET || "orbitlive_srm_trichy_2026_secret_key";
const PASSWORD_SALT =
  process.env.ORBIT_SALT || "orbitlive_srm_salt_2026";

function hashPasswordScrypt(plainTextPassword) {
  const normalized = String(plainTextPassword || "").trim();
  return crypto
    .scryptSync(normalized, PASSWORD_SALT, 32)
    .toString("hex");
}

function verifyPasswordScrypt(inputPassword, storedHash) {
  if (!inputPassword || !storedHash) return false;
  const inputHashBuf = crypto.scryptSync(
    String(inputPassword).trim(),
    PASSWORD_SALT,
    32
  );
  const storedHashBuf = Buffer.from(storedHash, "hex");
  if (inputHashBuf.length !== storedHashBuf.length) return false;
  return crypto.timingSafeEqual(inputHashBuf, storedHashBuf);
}

// Brute-force login protection (Blocks IP for 15 mins after 5 failed attempts)
const loginAttempts = new Map(); // Map<ip, { count, lockUntil }>

function checkRateLimit(ip) {
  const rec = loginAttempts.get(ip);
  if (!rec) return { allowed: true };
  if (rec.lockUntil && Date.now() < rec.lockUntil) {
    const waitMins = Math.ceil((rec.lockUntil - Date.now()) / 60000);
    return {
      allowed: false,
      message: `Too many failed login attempts. Try again in ${waitMins} min(s).`
    };
  }
  return { allowed: true };
}

function recordLoginFailure(ip) {
  const rec = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
  rec.count += 1;
  if (rec.count >= 5) {
    rec.lockUntil = Date.now() + 15 * 60 * 1000;
    rec.count = 0;
  }
  loginAttempts.set(ip, rec);
}

function clearLoginFailures(ip) {
  loginAttempts.delete(ip);
}

function createSignedToken(payloadStr) {
  const sig = crypto
    .createHmac("sha256", SERVER_SECRET)
    .update(payloadStr)
    .digest("hex")
    .slice(0, 24);
  return `${Buffer.from(payloadStr).toString("base64url")}.${sig}`;
}

function verifySignedToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [b64, sig] = token.split(".");
  try {
    const payloadStr = Buffer.from(b64, "base64url").toString("utf8");
    const expectedSig = crypto
      .createHmac("sha256", SERVER_SECRET)
      .update(payloadStr)
      .digest("hex")
      .slice(0, 24);
    if (sig !== expectedSig) return null;
    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
}

// Admin accounts store ONLY salted scrypt hashes in memory (never plaintext)
const DEFAULT_ADMIN_PASS = process.env.ORBIT_ADMIN_PASSWORD || "ORBITADMIN";
const ADMINS = [
  {
    id: "admin_1",
    label: "Admin 1 - Pavithrraraj",
    name: "Pavithrraraj",
    passwordHash: hashPasswordScrypt(process.env.ADMIN_1_PASSWORD || DEFAULT_ADMIN_PASS)
  },
  {
    id: "admin_2",
    label: "Admin 2 - Jeffrey",
    name: "Jeffrey",
    passwordHash: hashPasswordScrypt(process.env.ADMIN_2_PASSWORD || DEFAULT_ADMIN_PASS)
  },
  {
    id: "admin_3",
    label: "Admin 3 - Rakshan Kumaraa",
    name: "Rakshan Kumaraa",
    passwordHash: hashPasswordScrypt(process.env.ADMIN_3_PASSWORD || DEFAULT_ADMIN_PASS)
  }
];

let fleetRoutes = SRM_ROUTES.map((r) => {
  const defaultPass = `BUS${r.routeNo}`;
  return {
    ...r,
    driverPasswordHint: defaultPass,
    driverPasswordHash: hashPasswordScrypt(defaultPass),
    driverPasswordPaddedHash: hashPasswordScrypt(
      `BUS${String(r.routeNo).padStart(2, "0")}`
    ),
    driverName: "",
    driverPhone: ""
  };
});

let globalAnnouncement = null;

// ============================================================================
// 2. SERVERLESS-SAFE SHARED TMP CACHE
// ============================================================================
const TMP_STATE_FILE = path.join(os.tmpdir(), "orbitlive_shared_state_v2.json");
const activeRouteSharers = new Map();
const smoothedBusStates = new Map();
const primaryBusDebug = new Map();
const connectedClients = new Map();

function saveStateToTmpDisk() {
  try {
    const serializableSharers = {};
    for (const [rNo, sMap] of activeRouteSharers.entries()) {
      serializableSharers[rNo] = Array.from(sMap.entries());
    }
    const driverContacts = {};
    for (const r of fleetRoutes) {
      if (r.driverPhone || r.driverName) {
        driverContacts[r.routeNo] = {
          driverName: r.driverName,
          driverPhone: r.driverPhone
        };
      }
    }
    const payload = {
      ts: Date.now(),
      globalAnnouncement,
      driverContacts,
      sharers: serializableSharers
    };
    fs.writeFileSync(TMP_STATE_FILE, JSON.stringify(payload), "utf8");
  } catch {
    // Ignore disk restrictions
  }
}

function loadStateFromTmpDisk() {
  try {
    if (!fs.existsSync(TMP_STATE_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(TMP_STATE_FILE, "utf8"));
    if (!raw || Date.now() - raw.ts > 25000) return;
    if (raw.globalAnnouncement !== undefined) {
      globalAnnouncement = raw.globalAnnouncement;
    }
    if (raw.driverContacts) {
      for (const [rNoStr, info] of Object.entries(raw.driverContacts)) {
        const route = fleetRoutes.find((r) => r.routeNo === Number(rNoStr));
        if (route) {
          route.driverName = info.driverName || route.driverName;
          route.driverPhone = info.driverPhone || route.driverPhone;
        }
      }
    }
    if (raw.sharers) {
      for (const [rNoStr, entries] of Object.entries(raw.sharers)) {
        const rNo = Number(rNoStr);
        if (!activeRouteSharers.has(rNo)) {
          activeRouteSharers.set(rNo, new Map());
        }
        const sMap = activeRouteSharers.get(rNo);
        for (const [uid, session] of entries) {
          const existing = sMap.get(uid);
          if (!existing || session.timestamp > existing.timestamp) {
            sMap.set(uid, session);
          }
        }
      }
    }
  } catch {
    // Ignore parse error
  }
}

// ============================================================================
// 3. NON-BLOCKING OSRM ROAD POLYLINE SYNC
// ============================================================================
function interpolateCurve(p0, p1, p2, t) {
  const u = 1 - t;
  const lat = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
  const lng = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
  return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
}

export function rebuildRoutePolylinesFromStops(route) {
  if (!route.stops || route.stops.length === 0) return;
  const first = route.stops[0];
  const mid = route.stops[Math.floor(route.stops.length / 2)] || first;
  const last = route.stops[route.stops.length - 1];

  const p0 = [Number(first.lat), Number(first.lng)];
  const p1 = [Number(mid.lat), Number(mid.lng)];
  const p2 = [Number(last.lat), Number(last.lng)];

  const buildPath = (latOffset, lngOffset) => {
    const coords = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      coords.push(
        interpolateCurve(p0, [p1[0] + latOffset, p1[1] + lngOffset], p2, t)
      );
    }
    return coords;
  };

  route.validPaths = [
    { pathId: "path_a", name: "Path A • Main Highway Corridor", coordinates: buildPath(0, 0) },
    { pathId: "path_b", name: "Path B • Bypass Corridor", coordinates: buildPath(0.01, -0.012) },
    { pathId: "path_c", name: "Path C • Alternate City Road", coordinates: buildPath(-0.01, 0.011) }
  ];
}

async function hydrateSingleRouteOSRM(route) {
  try {
    if (!route.stops || route.stops.length < 2) return;
    const firstStop = route.stops[0];
    const midStop = route.stops[Math.floor(route.stops.length / 2)];
    const campusStop = route.stops[route.stops.length - 1];

    campusStop.lat = SRM_CAMPUS.lat;
    campusStop.lng = SRM_CAMPUS.lng;

    const coordsQuery = `${firstStop.lng},${firstStop.lat};${midStop.lng},${midStop.lat};${campusStop.lng},${campusStop.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsQuery}?alternatives=true&overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return;
    const data = await res.json();

    if (data.routes && data.routes.length > 0) {
      data.routes.forEach((osrmRoute, idx) => {
        const latLngs = osrmRoute.geometry.coordinates.map(([lng, lat]) => [
          Number(lat.toFixed(6)),
          Number(lng.toFixed(6))
        ]);
        latLngs.push([SRM_CAMPUS.lat, SRM_CAMPUS.lng]);
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
    // Keep precomputed curve coordinates
  }
}

setTimeout(async () => {
  for (const route of fleetRoutes) {
    await hydrateSingleRouteOSRM(route);
  }
}, 100);

// ============================================================================
// 4. IST TIME & COMMUTE-WINDOW KEEP-ALIVE
// ============================================================================
function getISTDate() {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return new Date(istString);
}

function isMorningTripActive() {
  return getISTDate().getHours() < 12;
}

function isCommuteWindowIST() {
  const ist = getISTDate();
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return (mins >= 375 && mins <= 555) || (mins >= 945 && mins <= 1110);
}

setInterval(async () => {
  if (isCommuteWindowIST() && process.env.CLIENT_URL) {
    try {
      await fetch(new URL("/api/health", process.env.CLIENT_URL));
    } catch {
      // Ignore
    }
  }
}, 480000);

// ============================================================================
// 5. GEOMETRY & ROUTE VALIDATION ENGINE
// ============================================================================
const MAX_ROUTE_CORRIDOR_METERS = 500;
const SRM_CAMPUS_RADIUS_METERS = 1800;
const MAX_BUS_DIVERGENCE_METERS = 450;
const PING_TTL_MS = 16000;
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
  const distToCampus = getDistanceMeters(
    lat,
    lng,
    SRM_CAMPUS.lat,
    SRM_CAMPUS.lng
  );

  let bestMatch = {
    isValid: false,
    minDistanceMeters: Infinity,
    matchedPathId: route.validPaths[0]?.pathId || "path_a",
    matchedPathName: route.validPaths[0]?.name || "Main Route",
    snappedLat: lat,
    snappedLng: lng
  };

  for (const path of route.validPaths || []) {
    const coords = path.coordinates || [];
    for (let i = 0; i < coords.length - 1; i++) {
      const [aLat, aLng] = coords[i];
      const [bLat, bLng] = coords[i + 1];
      const proj = closestPointOnSegment(lat, lng, aLat, aLng, bLat, bLng);
      if (proj.distMeters < bestMatch.minDistanceMeters) {
        bestMatch = {
          isValid:
            proj.distMeters <= MAX_ROUTE_CORRIDOR_METERS ||
            distToCampus <= SRM_CAMPUS_RADIUS_METERS,
          minDistanceMeters: Number(proj.distMeters.toFixed(1)),
          matchedPathId: path.pathId,
          matchedPathName: path.name,
          snappedLat: proj.lat,
          snappedLng: proj.lng
        };
      }
    }
  }

  if (distToCampus <= SRM_CAMPUS_RADIUS_METERS) {
    bestMatch.isValid = true;
    bestMatch.minDistanceMeters = Number(
      Math.min(bestMatch.minDistanceMeters, distToCampus).toFixed(1)
    );
    bestMatch.snappedLat = lat;
    bestMatch.snappedLng = lng;
  }

  for (const stop of route.stops || []) {
    const dStop = getDistanceMeters(lat, lng, stop.lat, stop.lng);
    if (dStop <= MAX_ROUTE_CORRIDOR_METERS) {
      bestMatch.isValid = true;
      bestMatch.minDistanceMeters = Number(
        Math.min(bestMatch.minDistanceMeters, dStop).toFixed(1)
      );
      bestMatch.snappedLat = lat;
      bestMatch.snappedLng = lng;
    }
  }

  return bestMatch;
}

function parseScheduledTimeMinutes(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2})[:.](\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const mins = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + mins;
}

// ============================================================================
// 6. SINGLE-PRIMARY TELEMETRY ENGINE
// ============================================================================
function computeBestBusTelemetry(routeNo) {
  loadStateFromTmpDisk();
  const route = fleetRoutes.find((r) => r.routeNo === Number(routeNo));
  if (!route) return null;

  const isMorning = isMorningTripActive();
  const sharerMap = activeRouteSharers.get(route.routeNo);
  if (!sharerMap || sharerMap.size === 0) {
    smoothedBusStates.delete(route.routeNo);
    primaryBusDebug.delete(route.routeNo);
    return null;
  }

  const now = Date.now();
  const activeCandidates = [];

  for (const [uid, ping] of sharerMap.entries()) {
    if (now - ping.timestamp > PING_TTL_MS) {
      sharerMap.delete(uid);
    } else {
      activeCandidates.push(ping);
    }
  }

  if (activeCandidates.length === 0) {
    smoothedBusStates.delete(route.routeNo);
    primaryBusDebug.delete(route.routeNo);
    return null;
  }

  const driverCandidates = activeCandidates.filter((c) => c.role === "DRIVER");
  const movingCandidates = activeCandidates.filter((c) => c.speedKmh >= 5);

  const pool =
    driverCandidates.length > 0
      ? driverCandidates
      : movingCandidates.length > 0
      ? movingCandidates
      : activeCandidates;

  pool.sort((a, b) => {
    if (Math.abs(a.distanceToRouteMeters - b.distanceToRouteMeters) > 1.5) {
      return a.distanceToRouteMeters - b.distanceToRouteMeters;
    }
    return a.accuracy - b.accuracy;
  });

  const primaryDevice = pool[0];

  primaryBusDebug.set(route.routeNo, {
    routeNo: route.routeNo,
    routeName: route.routeName,
    driverName: route.driverName || "",
    driverPhone: route.driverPhone || "",
    primaryUserId: primaryDevice.userId,
    primaryUserName: primaryDevice.userName || "Student",
    primaryRole: primaryDevice.role || "STUDENT",
    distanceToRouteMeters: primaryDevice.distanceToRouteMeters,
    speedKmh: Math.round(primaryDevice.speedKmh || 0),
    totalSharersOnBus: activeCandidates.length
  });

  let finalLat = primaryDevice.snappedLat * 0.7 + primaryDevice.lat * 0.3;
  let finalLng = primaryDevice.snappedLng * 0.7 + primaryDevice.lng * 0.3;
  let liveSpeedKmh = Math.max(0, Math.round(primaryDevice.speedKmh || 0));

  const prevState = smoothedBusStates.get(route.routeNo);
  if (prevState && now - prevState.timestamp < 6000) {
    const alpha = 0.75;
    finalLat = alpha * finalLat + (1 - alpha) * prevState.lat;
    finalLng = alpha * finalLng + (1 - alpha) * prevState.lng;
    liveSpeedKmh =
      liveSpeedKmh === 0
        ? 0
        : Math.round(alpha * liveSpeedKmh + (1 - alpha) * prevState.speedKmh);
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

  const effectiveSpeedForEta = liveSpeedKmh >= 8 ? liveSpeedKmh : 28;

  const stopEtas = route.stops.map((stop, idx) => {
    const distMeters = getDistanceMeters(finalLat, finalLng, stop.lat, stop.lng);
    const etaMinutes =
      idx === closestStopIdx && distMeters < 300
        ? 0
        : Math.max(
            1,
            Math.round((distMeters / 1000 / effectiveSpeedForEta) * 60)
          );
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

  let delayMinutes = 0;
  let delayStatus = "ON_TIME";
  if (isMorning) {
    const ist = getISTDate();
    const currentIstMins = ist.getHours() * 60 + ist.getMinutes();
    const schedMins = parseScheduledTimeMinutes(currentStopObj?.morningTime);
    if (schedMins !== null && currentIstMins >= 360 && currentIstMins <= 560) {
      delayMinutes = currentIstMins - schedMins;
      if (delayMinutes >= 5) delayStatus = "DELAYED";
      else if (delayMinutes <= -4) delayStatus = "EARLY";
    }
  }

  const progressPct = isMorning
    ? Math.min(
        100,
        Math.max(
          5,
          Math.round(
            (closestStopIdx / Math.max(1, route.stops.length - 1)) * 100
          )
        )
      )
    : Math.min(
        100,
        Math.max(
          5,
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
    driverName: route.driverName || "",
    driverPhone: route.driverPhone || "",
    activePathId: primaryDevice.matchedPathId,
    activePathName: primaryDevice.matchedPathName,
    currentStopIndex: closestStopIdx,
    currentStopNo: currentStopObj?.stopNo || 1,
    currentStopName: currentStopObj?.name || "In Transit",
    currentStopScheduledTime: currentStopObj?.morningTime || "",
    nextStopIndex: nextStopIdx,
    nextStopNo: nextStopObj?.stopNo || 1,
    nextStopName: nextStopObj?.name || "Next Stop",
    nextStopScheduledTime: nextStopObj?.morningTime || "",
    nextStopEtaMinutes: nextStopEtaObj ? nextStopEtaObj.etaMinutes : 1,
    nextStopDistanceKm: nextStopEtaObj ? nextStopEtaObj.distanceKm : 0,
    routeTerminalName: routeTerminalStopObj?.name || "SRM CAMPUS",
    routeTerminalScheduledTime: isMorning
      ? route.morningCampusArrival
      : route.eveningCampusDeparture,
    routeTerminalEtaMinutes: routeTerminalEtaObj
      ? routeTerminalEtaObj.etaMinutes
      : 1,
    routeTerminalDistanceKm: routeTerminalEtaObj
      ? routeTerminalEtaObj.distanceKm
      : 0,
    delayMinutes,
    delayStatus,
    progressPct,
    stopEtas,
    timestamp: now
  };

  smoothedBusStates.set(route.routeNo, state);
  return state;
}

// ============================================================================
// 7. LOCATION PING PROCESSOR
// ============================================================================
function processLocationPing(payload) {
  loadStateFromTmpDisk();
  const {
    routeNo,
    userId,
    userName = "Student",
    role = "STUDENT",
    driverToken = "",
    driverPhone = "",
    lat,
    lng,
    accuracy = 10,
    speedKmh = 0,
    homeStopNo = 1,
    socketId = null
  } = payload;

  const route = fleetRoutes.find((r) => r.routeNo === Number(routeNo));
  if (!route || !userId) {
    return {
      sharingStatus: { status: "ERROR", message: "Invalid bus route." },
      telemetry: null
    };
  }

  let verifiedRole = "STUDENT";
  if (role === "DRIVER") {
    const tokenData = verifySignedToken(driverToken);
    if (
      tokenData &&
      tokenData.role === "DRIVER" &&
      Number(tokenData.routeNo) === route.routeNo
    ) {
      verifiedRole = "DRIVER";
      if (driverPhone !== undefined) {
        route.driverPhone = String(driverPhone).trim();
      }
      if (userName) route.driverName = String(userName).trim();
    }
  }

  connectedClients.set(userId, {
    clientId: userId,
    name: userName,
    role: verifiedRole,
    routeNo: route.routeNo,
    lastSeen: Date.now()
  });

  if (!activeRouteSharers.has(route.routeNo)) {
    activeRouteSharers.set(route.routeNo, new Map());
  }
  const sharerMap = activeRouteSharers.get(route.routeNo);
  const existing = sharerMap.get(userId);
  const now = Date.now();

  if (existing && now - existing.timestamp < MIN_USER_PING_INTERVAL_MS) {
    return {
      sharingStatus: {
        status: "ACCEPTED_ACTIVE",
        message:
          verifiedRole === "DRIVER"
            ? `Driver Broadcast Active • Bus #${String(route.routeNo).padStart(2, "0")}`
            : `Sharing live location for Bus #${String(route.routeNo).padStart(2, "0")}`
      },
      telemetry: smoothedBusStates.get(route.routeNo) || null
    };
  }

  let numLat = Number(lat);
  let numLng = Number(lng);
  let correctedForIspDrift = false;

  const rawDistToCampus = getDistanceMeters(
    numLat,
    numLng,
    SRM_CAMPUS.lat,
    SRM_CAMPUS.lng
  );
  if (Number(accuracy) > 350 || rawDistToCampus > 25000) {
    numLat = SRM_CAMPUS.lat;
    numLng = SRM_CAMPUS.lng;
    correctedForIspDrift = true;
  }

  const validation = validateAgainstRoutePaths(route, numLat, numLng);
  if (!validation.isValid) {
    sharerMap.delete(userId);
    saveStateToTmpDisk();
    return {
      sharingStatus: {
        status: "CUTOFF_OUT_OF_ROUTE",
        distanceMeters: Math.round(validation.minDistanceMeters),
        message: `Live location sharing stopped — you are ${Math.round(
          validation.minDistanceMeters
        )}m away from Bus #${String(route.routeNo).padStart(
          2,
          "0"
        )}'s route (must be within 500m).`
      },
      correctedCoords: { lat: numLat, lng: numLng },
      telemetry: computeBestBusTelemetry(route.routeNo)
    };
  }

  const currentBus = smoothedBusStates.get(route.routeNo);
  if (
    verifiedRole !== "DRIVER" &&
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
      saveStateToTmpDisk();
      return {
        sharingStatus: {
          status: "CUTOFF_AWAY_FROM_BUS",
          distanceMeters: Math.round(distFromLiveBus),
          message: `Location sharing stopped — your location is ${Math.round(
            distFromLiveBus
          )}m away from the moving bus.`
        },
        correctedCoords: { lat: numLat, lng: numLng },
        telemetry: currentBus
      };
    }
  }

  let computedSpeedKmh = Math.max(0, Math.round(Number(speedKmh) || 0));
  let totalTraveledMeters = existing ? existing.totalTraveledMeters || 0 : 0;

  if (existing) {
    const stepMeters = getDistanceMeters(
      existing.lat,
      existing.lng,
      numLat,
      numLng
    );
    if (stepMeters > 12) {
      totalTraveledMeters += stepMeters;
      if (computedSpeedKmh === 0) {
        const dtSeconds = Math.max(1, (now - existing.timestamp) / 1000);
        const derivedKmh = (stepMeters / dtSeconds) * 3.6;
        if (derivedKmh >= 4 && derivedKmh <= 110) {
          computedSpeedKmh = Math.round(derivedKmh);
        }
      }
    }
  }

  if (totalTraveledMeters > 600 && verifiedRole !== "DRIVER") {
    const isMorning = isMorningTripActive();
    if (isMorning) {
      const distToCampus = getDistanceMeters(
        numLat,
        numLng,
        SRM_CAMPUS.lat,
        SRM_CAMPUS.lng
      );
      if (distToCampus <= SRM_CAMPUS.autoOffRadiusMeters) {
        sharerMap.delete(userId);
        saveStateToTmpDisk();
        return {
          sharingStatus: {
            status: "AUTO_STOPPED_DESTINATION",
            message:
              "Arrived at SRM Trichy Campus. Location sharing automatically turned off."
          },
          correctedCoords: { lat: numLat, lng: numLng },
          telemetry: computeBestBusTelemetry(route.routeNo)
        };
      }
    } else {
      const homeStop =
        route.stops.find((s) => s.stopNo === Number(homeStopNo)) ||
        route.stops[0];
      const distToHome = getDistanceMeters(
        numLat,
        numLng,
        homeStop.lat,
        homeStop.lng
      );
      if (distToHome <= 300) {
        sharerMap.delete(userId);
        saveStateToTmpDisk();
        return {
          sharingStatus: {
            status: "AUTO_STOPPED_DESTINATION",
            message: `Arrived at ${homeStop.name}. Location sharing automatically turned off.`
          },
          correctedCoords: { lat: numLat, lng: numLng },
          telemetry: computeBestBusTelemetry(route.routeNo)
        };
      }
    }
  }

  sharerMap.set(userId, {
    userId,
    userName,
    role: verifiedRole,
    socketId,
    lat: numLat,
    lng: numLng,
    snappedLat: validation.snappedLat,
    snappedLng: validation.snappedLng,
    distanceToRouteMeters: validation.minDistanceMeters,
    matchedPathId: validation.matchedPathId,
    matchedPathName: validation.matchedPathName,
    accuracy: correctedForIspDrift ? 8 : Number(accuracy) || 10,
    speedKmh: computedSpeedKmh,
    homeStopNo: Number(homeStopNo),
    totalTraveledMeters,
    timestamp: now
  });

  saveStateToTmpDisk();
  const updatedTelemetry = computeBestBusTelemetry(route.routeNo);

  return {
    sharingStatus: {
      status: "ACCEPTED_ACTIVE",
      message:
        verifiedRole === "DRIVER"
          ? `Driver Broadcast Active • Bus #${String(route.routeNo).padStart(2, "0")}`
          : `Sharing live location for Bus #${String(route.routeNo).padStart(2, "0")}`
    },
    correctedCoords: { lat: numLat, lng: numLng },
    telemetry: updatedTelemetry
  };
}

// ============================================================================
// 8. AUTHENTICATION & ADMIN ENDPOINTS (Salted Hash Verified)
// ============================================================================
function requireAdminAuth(req, res, next) {
  const token = req.headers["x-admin-token"];
  const data = verifySignedToken(token);
  if (!data || data.role !== "ADMIN") {
    return res.status(401).json({ ok: false, message: "Unauthorized Admin request." });
  }
  req.adminUser = data;
  next();
}

// Public routes never expose password hashes or hints
function buildPublicRoutesSummary() {
  return fleetRoutes.map((r) => {
    const {
      driverPasswordHint,
      driverPasswordHash,
      driverPasswordPaddedHash,
      ...publicRoute
    } = r;
    return {
      ...publicRoute,
      liveTelemetry: computeBestBusTelemetry(r.routeNo) || null
    };
  });
}

function getAdminDashboardSnapshot() {
  loadStateFromTmpDisk();
  const now = Date.now();
  for (const [cid, info] of connectedClients.entries()) {
    if (now - info.lastSeen > 45000) {
      connectedClients.delete(cid);
    }
  }

  let totalSharingUsers = 0;
  const activeBusDetails = [];

  for (const r of fleetRoutes) {
    computeBestBusTelemetry(r.routeNo);
    const sMap = activeRouteSharers.get(r.routeNo);
    if (sMap) totalSharingUsers += sMap.size;
    const pDebug = primaryBusDebug.get(r.routeNo);
    if (pDebug) activeBusDetails.push(pDebug);
  }

  const clientsArray = Array.from(connectedClients.values());

  return {
    totalConcurrentUsers: Math.max(
      clientsArray.length,
      totalSharingUsers,
      io.engine.clientsCount || 1
    ),
    studentCount: clientsArray.filter((c) => c.role === "STUDENT").length,
    driverCount: clientsArray.filter((c) => c.role === "DRIVER").length,
    adminCount: Math.max(1, clientsArray.filter((c) => c.role === "ADMIN").length),
    totalSharingUsers,
    activeBusesCount: activeBusDetails.length,
    totalBusesCount: fleetRoutes.length,
    activeBusPrimaryList: activeBusDetails,
    announcement: globalAnnouncement,
    routes: fleetRoutes.map((r) => ({
      ...r,
      driverPassword: r.driverPasswordHint
    }))
  };
}

// Driver Login (Verified with Salted Scrypt Hash + Brute-Force Protection)
app.post(["/api/auth/driver", "/auth/driver"], (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local";
  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return res.status(429).json({ ok: false, message: rateCheck.message });
  }

  const { routeNo, password, driverName = "Bus Driver", driverPhone = "" } = req.body || {};
  const route = fleetRoutes.find((r) => r.routeNo === Number(routeNo));
  if (!route) {
    return res.status(404).json({ ok: false, message: "Bus number not found." });
  }

  const cleanInput = String(password || "").trim().toUpperCase();
  const isValidPrimary = verifyPasswordScrypt(cleanInput, route.driverPasswordHash);
  const isValidPadded =
    route.driverPasswordPaddedHash &&
    verifyPasswordScrypt(cleanInput, route.driverPasswordPaddedHash);

  if (!isValidPrimary && !isValidPadded) {
    recordLoginFailure(clientIp);
    return res.status(401).json({
      ok: false,
      message: `Invalid password for Bus #${String(route.routeNo).padStart(2, "0")}.`
    });
  }

  clearLoginFailures(clientIp);
  route.driverName = String(driverName || "Bus Driver").trim();
  route.driverPhone = String(driverPhone || "").trim();
  saveStateToTmpDisk();

  const driverToken = createSignedToken(
    JSON.stringify({
      role: "DRIVER",
      routeNo: route.routeNo,
      ts: Date.now()
    })
  );

  io.emit("routes_updated", buildPublicRoutesSummary());

  return res.json({
    ok: true,
    profile: {
      role: "DRIVER",
      name: route.driverName,
      routeNo: route.routeNo,
      routeName: route.routeName,
      driverPhone: route.driverPhone,
      driverToken,
      homeStopNo: 1
    }
  });
});

// Admin Login (Verified with Salted Scrypt Hash + Brute-Force Protection)
app.post(["/api/auth/admin", "/auth/admin"], (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local";
  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return res.status(429).json({ ok: false, message: rateCheck.message });
  }

  const { adminId, password } = req.body || {};
  const admin = ADMINS.find((a) => a.id === adminId || a.name === adminId);
  if (!admin) {
    return res.status(404).json({ ok: false, message: "Select a valid Admin." });
  }

  if (!verifyPasswordScrypt(String(password || "").trim(), admin.passwordHash)) {
    recordLoginFailure(clientIp);
    return res.status(401).json({ ok: false, message: "Incorrect Admin password." });
  }

  clearLoginFailures(clientIp);
  const adminToken = createSignedToken(
    JSON.stringify({
      role: "ADMIN",
      adminId: admin.id,
      name: admin.name,
      ts: Date.now()
    })
  );

  return res.json({
    ok: true,
    profile: {
      role: "ADMIN",
      adminId: admin.id,
      name: admin.name,
      label: admin.label,
      adminToken
    },
    snapshot: getAdminDashboardSnapshot()
  });
});

app.get(["/api/admin/overview", "/admin/overview"], requireAdminAuth, (req, res) => {
  res.json(getAdminDashboardSnapshot());
});

app.post(["/api/admin/bus", "/admin/bus"], requireAdminAuth, (req, res) => {
  const {
    routeNo,
    routeName,
    morningStartTime = "07:30 AM",
    morningCampusArrival = "08:45 AM",
    eveningCampusDeparture = "04:35 PM",
    driverPassword,
    driverPhone = "",
    stops = []
  } = req.body || {};

  const rNo = Number(routeNo);
  if (!rNo || !routeName) {
    return res.status(400).json({ ok: false, message: "Bus number and route name required." });
  }
  if (fleetRoutes.some((r) => r.routeNo === rNo)) {
    return res.status(400).json({ ok: false, message: `Bus #${rNo} already exists.` });
  }

  const normalizedStops =
    Array.isArray(stops) && stops.length > 0
      ? stops.map((s, idx) => ({
          stopNo: idx + 1,
          name: String(s.name || `Stop ${idx + 1}`).toUpperCase(),
          morningTime: s.morningTime || morningStartTime,
          lat: Number(s.lat) || 10.8339,
          lng: Number(s.lng) || 78.6933
        }))
      : [
          {
            stopNo: 1,
            name: String(routeName).toUpperCase(),
            morningTime: morningStartTime,
            lat: 10.8339,
            lng: 78.6933
          },
          {
            stopNo: 2,
            name: "SRM CAMPUS",
            morningTime: morningCampusArrival,
            lat: SRM_CAMPUS.lat,
            lng: SRM_CAMPUS.lng
          }
        ];

  const passPlain = String(driverPassword || `BUS${rNo}`).trim().toUpperCase();

  const newRoute = {
    routeNo: rNo,
    routeName: String(routeName).toUpperCase(),
    morningStartTime,
    morningCampusArrival,
    eveningCampusDeparture,
    driverPasswordHint: passPlain,
    driverPasswordHash: hashPasswordScrypt(passPlain),
    driverPasswordPaddedHash: hashPasswordScrypt(`BUS${String(rNo).padStart(2, "0")}`),
    driverName: "",
    driverPhone,
    stops: normalizedStops,
    validPaths: []
  };

  rebuildRoutePolylinesFromStops(newRoute);
  hydrateSingleRouteOSRM(newRoute);

  fleetRoutes.push(newRoute);
  fleetRoutes.sort((a, b) => a.routeNo - b.routeNo);
  saveStateToTmpDisk();

  io.emit("routes_updated", buildPublicRoutesSummary());
  res.json({ ok: true, snapshot: getAdminDashboardSnapshot() });
});

app.put(["/api/admin/bus/:routeNo", "/admin/bus/:routeNo"], requireAdminAuth, (req, res) => {
  const rNo = Number(req.params.routeNo);
  const route = fleetRoutes.find((r) => r.routeNo === rNo);
  if (!route) {
    return res.status(404).json({ ok: false, message: "Bus not found." });
  }

  const {
    routeName,
    morningStartTime,
    morningCampusArrival,
    eveningCampusDeparture,
    driverPassword,
    driverPhone,
    stops
  } = req.body || {};

  if (routeName !== undefined) route.routeName = String(routeName).toUpperCase();
  if (morningStartTime !== undefined) route.morningStartTime = morningStartTime;
  if (morningCampusArrival !== undefined) route.morningCampusArrival = morningCampusArrival;
  if (eveningCampusDeparture !== undefined) route.eveningCampusDeparture = eveningCampusDeparture;
  if (driverPassword !== undefined && String(driverPassword).trim()) {
    const cleanPass = String(driverPassword).trim().toUpperCase();
    route.driverPasswordHint = cleanPass;
    route.driverPasswordHash = hashPasswordScrypt(cleanPass);
  }
  if (driverPhone !== undefined) route.driverPhone = String(driverPhone).trim();

  if (Array.isArray(stops) && stops.length > 0) {
    route.stops = stops.map((s, idx) => ({
      stopNo: idx + 1,
      name: String(s.name || `Stop #${idx + 1}`).toUpperCase(),
      morningTime: s.morningTime || "07:45 AM",
      lat: Number(s.lat) || SRM_CAMPUS.lat,
      lng: Number(s.lng) || SRM_CAMPUS.lng
    }));
    rebuildRoutePolylinesFromStops(route);
    hydrateSingleRouteOSRM(route);
  }

  saveStateToTmpDisk();
  io.emit("routes_updated", buildPublicRoutesSummary());
  res.json({ ok: true, snapshot: getAdminDashboardSnapshot() });
});

app.delete(["/api/admin/bus/:routeNo", "/admin/bus/:routeNo"], requireAdminAuth, (req, res) => {
  const rNo = Number(req.params.routeNo);
  fleetRoutes = fleetRoutes.filter((r) => r.routeNo !== rNo);
  activeRouteSharers.delete(rNo);
  smoothedBusStates.delete(rNo);
  primaryBusDebug.delete(rNo);
  saveStateToTmpDisk();

  io.emit("routes_updated", buildPublicRoutesSummary());
  res.json({ ok: true, snapshot: getAdminDashboardSnapshot() });
});

app.post(["/api/admin/kick-sharer", "/admin/kick-sharer"], requireAdminAuth, (req, res) => {
  const { routeNo, userId } = req.body || {};
  const sMap = activeRouteSharers.get(Number(routeNo));
  if (sMap) sMap.delete(userId);
  saveStateToTmpDisk();
  computeBestBusTelemetry(Number(routeNo));
  res.json({ ok: true, snapshot: getAdminDashboardSnapshot() });
});

app.post(["/api/admin/announcement", "/admin/announcement"], requireAdminAuth, (req, res) => {
  const { text, byAdmin = "Admin" } = req.body || {};
  globalAnnouncement = text
    ? { text: String(text).trim(), byAdmin, timestamp: Date.now() }
    : null;
  saveStateToTmpDisk();
  io.emit("announcement_update", globalAnnouncement);
  res.json({ ok: true, snapshot: getAdminDashboardSnapshot() });
});

// ============================================================================
// 9. HIGH-SCALE PUBLIC ENDPOINTS
// ============================================================================
app.get(["/api/health", "/health"], (req, res) => {
  res.json({
    status: "ok",
    isMorningIST: isMorningTripActive(),
    activeBuses: smoothedBusStates.size
  });
});

app.get(["/api/routes", "/routes"], (req, res) => {
  loadStateFromTmpDisk();
  res.set("Cache-Control", "public, s-maxage=3, stale-while-revalidate=6");
  res.json({
    campus: SRM_CAMPUS,
    isMorningIST: isMorningTripActive(),
    announcement: globalAnnouncement,
    admins: ADMINS.map((a) => ({ id: a.id, label: a.label, name: a.name })),
    routes: buildPublicRoutesSummary()
  });
});

app.get(["/api/telemetry/:routeNo", "/telemetry/:routeNo"], (req, res) => {
  res.set("Cache-Control", "public, s-maxage=2, stale-while-revalidate=3");
  const rNo = Number(req.params.routeNo);
  const route = fleetRoutes.find((r) => r.routeNo === rNo);
  const telemetry = computeBestBusTelemetry(rNo);
  const activeSummary = [];

  for (const r of fleetRoutes) {
    const t = smoothedBusStates.get(r.routeNo);
    if (t && t.started) {
      activeSummary.push({
        routeNo: t.routeNo,
        speedKmh: t.speedKmh,
        currentStopName: t.currentStopName
      });
    }
  }

  res.json({
    telemetry: telemetry || {
      routeNo: rNo,
      started: false,
      speedKmh: 0,
      driverName: route?.driverName || "",
      driverPhone: route?.driverPhone || "",
      isMorning: isMorningTripActive()
    },
    announcement: globalAnnouncement,
    activeBuses: activeSummary
  });
});

app.post(["/api/presence", "/presence"], (req, res) => {
  const { clientId, name = "User", role = "STUDENT", routeNo = 1 } = req.body || {};
  if (clientId) {
    connectedClients.set(String(clientId), {
      clientId: String(clientId),
      name: String(name),
      role: String(role),
      routeNo: Number(routeNo),
      lastSeen: Date.now()
    });
  }
  res.json({ ok: true });
});

app.post(["/api/ping", "/ping"], (req, res) => {
  const result = processLocationPing(req.body || {});
  if (result.telemetry) {
    io.to(`room:bus_${result.telemetry.routeNo}`).emit(
      "bus_telemetry_update",
      result.telemetry
    );
  }
  res.json(result);
});

app.post(["/api/stop-sharing", "/stop-sharing"], (req, res) => {
  const { routeNo, userId } = req.body || {};
  const rNo = Number(routeNo);
  const sharerMap = activeRouteSharers.get(rNo);
  if (sharerMap) sharerMap.delete(userId);
  saveStateToTmpDisk();

  const updated = computeBestBusTelemetry(rNo);
  const route = fleetRoutes.find((r) => r.routeNo === rNo);

  io.to(`room:bus_${rNo}`).emit(
    "bus_telemetry_update",
    updated || {
      routeNo: rNo,
      started: false,
      speedKmh: 0,
      driverName: route?.driverName || "",
      driverPhone: route?.driverPhone || "",
      isMorning: isMorningTripActive()
    }
  );
  res.json({ ok: true });
});

// ============================================================================
// 10. SOCKET.IO REALTIME ENGINE
// ============================================================================
io.on("connection", (socket) => {
  socket.on("register_presence", ({ clientId, name, role, routeNo }) => {
    if (clientId) {
      connectedClients.set(String(clientId), {
        clientId: String(clientId),
        name: name || "User",
        role: role || "STUDENT",
        routeNo: Number(routeNo) || 1,
        socketId: socket.id,
        lastSeen: Date.now()
      });
    }
  });

  socket.on("join_route", ({ routeNo }) => {
    const rNo = Number(routeNo);
    socket.join(`room:bus_${rNo}`);
    const current = computeBestBusTelemetry(rNo);
    const route = fleetRoutes.find((r) => r.routeNo === rNo);
    socket.emit(
      "bus_telemetry_update",
      current || {
        routeNo: rNo,
        started: false,
        speedKmh: 0,
        driverName: route?.driverName || "",
        driverPhone: route?.driverPhone || "",
        isMorning: isMorningTripActive()
      }
    );
  });

  socket.on("leave_route", ({ routeNo }) => {
    socket.leave(`room:bus_${Number(routeNo)}`);
  });

  socket.on("student_location_ping", (payload) => {
    const result = processLocationPing({
      ...payload,
      socketId: socket.id
    });
    socket.emit("sharing_status", result.sharingStatus);
    if (result.correctedCoords) {
      socket.emit("calibrated_coords", result.correctedCoords);
    }
    if (result.telemetry) {
      io.to(`room:bus_${result.telemetry.routeNo}`).emit(
        "bus_telemetry_update",
        result.telemetry
      );
    }
  });

  socket.on("stop_sharing", ({ routeNo, userId }) => {
    const sharerMap = activeRouteSharers.get(Number(routeNo));
    if (sharerMap) sharerMap.delete(userId);
    saveStateToTmpDisk();
  });

  socket.on("disconnect", () => {
    for (const sharerMap of activeRouteSharers.values()) {
      for (const [uid, session] of sharerMap.entries()) {
        if (session.socketId === socket.id) {
          sharerMap.delete(uid);
        }
      }
    }
    for (const [cid, info] of connectedClients.entries()) {
      if (info.socketId === socket.id) {
        connectedClients.delete(cid);
      }
    }
  });
});

setInterval(() => {
  const isMorning = isMorningTripActive();
  const activeSummary = [];
  for (const route of fleetRoutes) {
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
        speedKmh: 0,
        driverName: route.driverName || "",
        driverPhone: route.driverPhone || "",
        isMorning
      });
    }
  }
  io.emit("active_buses_overview", activeSummary);
}, 1000);

const PORT = process.env.PORT || 4000;
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 OrbitLive Secure Server listening on port ${PORT}`);
  });
}

export default app;