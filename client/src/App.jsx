// client/src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import {
  Sun,
  Moon,
  Navigation,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  User,
  Check,
  Clock,
  LogOut,
  Gauge,
  Flag,
  ArrowRightCircle,
  ArrowRight
} from "lucide-react";
import LiveMap from "./components/LiveMap.jsx";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// Returns true before 12:00 PM (Morning -> SRM Trichy), false from 12:00 PM onwards (Evening -> Home Stop)
function checkIsMorning() {
  return new Date().getHours() < 12;
}

// ============================================================================
// 1. ORBITLIVE GEOMETRIC SVG LOGO
// ============================================================================
function OrbitLogo({ size = 36 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-xl bg-slate-900 dark:bg-slate-800/90 border border-slate-700/70 flex items-center justify-center shadow-md shrink-0"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="w-3/5 h-3/5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="16"
          cy="16"
          rx="12"
          ry="5.5"
          transform="rotate(-28 16 16)"
          stroke="#94a3b8"
          strokeWidth="1.75"
          strokeDasharray="3 2"
        />
        <ellipse
          cx="16"
          cy="16"
          rx="12"
          ry="5.5"
          transform="rotate(32 16 16)"
          stroke="#38bdf8"
          strokeWidth="1.85"
        />
        <circle cx="16" cy="16" r="3.6" fill="#f8fafc" />
        <circle cx="24.5" cy="11.5" r="2.2" fill="#38bdf8" />
      </svg>
    </div>
  );
}

// ============================================================================
// 2. FROSTED-GLASS DROPDOWN BOX COMPONENT
// ============================================================================
function GlassDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  searchable = true,
  compact = false
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  const selectedOption = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(q))
    );
  }, [options, query]);

  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        className={`w-full flex items-center justify-between gap-1.5 text-left rounded-2xl backdrop-blur-xl transition border ${
          compact ? "px-2.5 py-2 text-[11px]" : "px-4 py-3 text-xs sm:text-sm"
        } bg-white/75 dark:bg-slate-900/75 border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-sm`}
      >
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </div>
          {!compact && selectedOption?.sublabel && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {selectedOption.sublabel}
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-2 z-50 min-w-[230px] rounded-2xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-white/15 shadow-2xl overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-slate-200/70 dark:border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-transparent focus:outline-none focus:border-sky-500/50"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching result
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-300"
                        : "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">
                        {opt.label}
                      </div>
                      {opt.sublabel && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-sky-500 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. MAIN APPLICATION
// ============================================================================
export default function App() {
  // Default to Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("orbitlive_dark");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("orbitlive_dark", JSON.stringify(darkMode));
  }, [darkMode]);

  // Automatic 12:00 PM Rule Clock Watcher (Updates automatically if clock crosses 12:00 PM)
  const [isMorning, setIsMorning] = useState(checkIsMorning);
  useEffect(() => {
    const timer = setInterval(() => {
      setIsMorning(checkIsMorning());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Persistent Student Login Profile + Per-Bus Stop Memory
  const [savedUser, setSavedUser] = useState(() => {
    const raw = localStorage.getItem("orbitlive_user_v3");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  // Per-bus stop map so changing buses NEVER blindly resets your stop to #1
  const [stopByRoute, setStopByRoute] = useState(() => {
    const raw = localStorage.getItem("orbitlive_stops_map");
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  });

  const [isEditingProfile, setIsEditingProfile] = useState(!savedUser);

  // Onboarding Form State
  const [formName, setFormName] = useState(savedUser?.name || "");
  const [formRouteNo, setFormRouteNo] = useState(savedUser?.routeNo || 25);
  const [formStopNo, setFormStopNo] = useState(savedUser?.homeStopNo || "");

  // Active Bus & Stop State on Map
  const [routes, setRoutes] = useState([]);
  const [selectedRouteNo, setSelectedRouteNo] = useState(
    savedUser?.routeNo || 25
  );
  const [homeStopNo, setHomeStopNo] = useState(savedUser?.homeStopNo || 1);

  // Live Telemetry & GPS State
  const [telemetry, setTelemetry] = useState(null);
  const [activeBuses, setActiveBuses] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [myCoords, setMyCoords] = useState(null);
  const [sharingFeedback, setSharingFeedback] = useState(null);
  const [focusedStop, setFocusedStop] = useState(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const wakeLockRef = useRef(null);

  const userIdRef = useRef(
    localStorage.getItem("orbitlive_uid") ||
      `srm_${Math.random().toString(36).substring(2, 10)}`
  );

  useEffect(() => {
    localStorage.setItem("orbitlive_uid", userIdRef.current);
  }, []);

  const latestConfigRef = useRef({
    selectedRouteNo,
    homeStopNo,
    studentName: savedUser?.name || "Student"
  });

  useEffect(() => {
    latestConfigRef.current = {
      selectedRouteNo,
      homeStopNo,
      studentName: savedUser?.name || "Student"
    };
  }, [selectedRouteNo, homeStopNo, savedUser]);

  // Fetch all 31 SRM Trichy Bus Routes
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/routes`)
      .then((res) => res.json())
      .then((data) => {
        setRoutes(data.routes || []);
        if (typeof data.isMorningIST === "boolean") {
          setIsMorning(data.isMorningIST);
        }
      })
      .catch((err) => console.error("Failed to load SRM routes:", err));
  }, []);

  // Connect to Realtime Socket.io Server
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_route", {
        routeNo: latestConfigRef.current.selectedRouteNo
      });
    });

    socket.on("bus_telemetry_update", (data) => {
      if (
        Number(data.routeNo) === Number(latestConfigRef.current.selectedRouteNo)
      ) {
        if (typeof data.isMorning === "boolean") {
          setIsMorning(data.isMorning);
        }
        setTelemetry(data.started ? data : null);
      }
    });

    socket.on("active_buses_overview", (list) => {
      if (Array.isArray(list)) setActiveBuses(list);
    });

    socket.on("sharing_status", (statusObj) => {
      setSharingFeedback(statusObj);
      if (
        statusObj.status === "CUTOFF_OUT_OF_ROUTE" ||
        statusObj.status === "CUTOFF_AWAY_FROM_BUS" ||
        statusObj.status === "AUTO_STOPPED_DESTINATION"
      ) {
        stopLiveLocationSharing(false);
      }
    });

    return () => socket.disconnect();
  }, []);

  // Switch active Socket room when switching Bus Number
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    setTelemetry(null);
    socket.emit("join_route", { routeNo: selectedRouteNo });

    return () => {
      socket.emit("leave_route", { routeNo: selectedRouteNo });
    };
  }, [selectedRouteNo]);

  const currentRoute = useMemo(
    () =>
      routes.find((r) => r.routeNo === Number(selectedRouteNo)) || routes[0],
    [routes, selectedRouteNo]
  );

  const formSelectedRoute = useMemo(
    () => routes.find((r) => r.routeNo === Number(formRouteNo)) || routes[0],
    [routes, formRouteNo]
  );

  // Helper to change bus on the main map AND restore that bus's remembered stop
  function handleSwitchBusOnMap(newRouteNo) {
    const rNo = Number(newRouteNo);
    setSelectedRouteNo(rNo);

    // Check if the user has a saved stop for this specific bus
    if (savedUser && Number(savedUser.routeNo) === rNo) {
      setHomeStopNo(savedUser.homeStopNo);
    } else if (stopByRoute[rNo]) {
      setHomeStopNo(stopByRoute[rNo]);
    } else {
      const targetRoute = routes.find((r) => r.routeNo === rNo);
      if (targetRoute && targetRoute.stops.length > 0) {
        setHomeStopNo(targetRoute.stops[0].stopNo);
      }
    }
  }

  // Helper when user changes their stop for the currently viewed bus
  function handleSwitchStopOnMap(newStopNo) {
    const sNo = Number(newStopNo);
    setHomeStopNo(sNo);

    const updatedMap = { ...stopByRoute, [selectedRouteNo]: sNo };
    setStopByRoute(updatedMap);
    localStorage.setItem("orbitlive_stops_map", JSON.stringify(updatedMap));

    // Also update savedUser if they are adjusting their stop on their primary bus
    if (savedUser && Number(savedUser.routeNo) === Number(selectedRouteNo)) {
      const stopObj = currentRoute?.stops.find((s) => s.stopNo === sNo);
      const updatedUser = {
        ...savedUser,
        homeStopNo: sNo,
        homeStopName: stopObj?.name || savedUser.homeStopName
      };
      setSavedUser(updatedUser);
      localStorage.setItem("orbitlive_user_v3", JSON.stringify(updatedUser));
    }
  }

  // Dropdown options for All 31 Buses
  const busDropdownOptions = useMemo(
    () =>
      routes.map((r) => {
        const isLive = activeBuses.some((b) => b.routeNo === r.routeNo);
        return {
          value: r.routeNo,
          label: `Bus #${String(r.routeNo).padStart(2, "0")} — ${r.routeName}`,
          sublabel: `${
            isLive ? "🟢 Live • " : "⏳ Not Started • "
          }Starts ${r.morningStartTime} (${r.stops.length} Stops)`
        };
      }),
    [routes, activeBuses]
  );

  // Stop options for Login Form
  const formStopDropdownOptions = useMemo(() => {
    if (!formSelectedRoute) return [];
    return formSelectedRoute.stops.slice(0, -1).map((s) => ({
      value: s.stopNo,
      label: `Stop #${s.stopNo} — ${s.name}`,
      sublabel: `Morning Timing: ${s.morningTime}`
    }));
  }, [formSelectedRoute]);

  // Stop options for Main Top Header Stop Switcher
  const activeRouteStopOptions = useMemo(() => {
    if (!currentRoute) return [];
    return currentRoute.stops.slice(0, -1).map((s) => ({
      value: s.stopNo,
      label: `Your Stop: #${s.stopNo} ${s.name}`,
      sublabel: `Scheduled: ${s.morningTime}`
    }));
  }, [currentRoute]);

  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // Ignored if unsupported
    }
  }

  function startLiveLocationSharing() {
    if (!("geolocation" in navigator)) {
      setSharingFeedback({
        status: "ERROR",
        message: "Location services are not supported on this device."
      });
      return;
    }

    if (watchIdRef.current !== null) return;
    setIsSharing(true);
    requestWakeLock();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        setMyCoords({ lat: latitude, lng: longitude, accuracy });

        const speedKmh = speed && speed > 0 ? Math.round(speed * 3.6) : 0;
        const cfg = latestConfigRef.current;

        socketRef.current?.emit("student_location_ping", {
          routeNo: cfg.selectedRouteNo,
          userId: userIdRef.current,
          studentName: cfg.studentName,
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || 10,
          speedKmh,
          homeStopNo: cfg.homeStopNo
        });
      },
      (err) => {
        setSharingFeedback({
          status: "ERROR",
          message: `Location permission required: ${err.message}`
        });
        setIsSharing(false);
        watchIdRef.current = null;
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  }

  function stopLiveLocationSharing(clearMessage = true) {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
    socketRef.current?.emit("stop_sharing", {
      routeNo: latestConfigRef.current.selectedRouteNo,
      userId: userIdRef.current
    });
    setIsSharing(false);
    if (clearMessage) setSharingFeedback(null);
  }

  // Automatic Location Sharing on Launch + Periodic Auto-Retry if Student Walks Into 500m Corridor
  useEffect(() => {
    if (savedUser && !isEditingProfile && currentRoute && !isSharing) {
      startLiveLocationSharing();
    }
    const autoRetryInterval = setInterval(() => {
      if (
        savedUser &&
        !isEditingProfile &&
        !watchIdRef.current &&
        sharingFeedback?.status !== "AUTO_STOPPED_DESTINATION"
      ) {
        startLiveLocationSharing();
      }
    }, 20000);

    return () => clearInterval(autoRetryInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedUser, isEditingProfile, currentRoute?.routeNo]);

  function handleLoginSubmit(e) {
    e.preventDefault();
    if (!formName.trim() || !formStopNo) return;

    const selectedStopObj =
      formSelectedRoute?.stops.find(
        (s) => s.stopNo === Number(formStopNo)
      ) || formSelectedRoute?.stops[0];

    const rNo = Number(formRouteNo);
    const sNo = Number(selectedStopObj.stopNo);

    const profileData = {
      name: formName.trim(),
      routeNo: rNo,
      routeName: formSelectedRoute?.routeName || "",
      homeStopNo: sNo,
      homeStopName: selectedStopObj?.name || ""
    };

    const updatedStopsMap = { ...stopByRoute, [rNo]: sNo };
    setStopByRoute(updatedStopsMap);
    localStorage.setItem("orbitlive_stops_map", JSON.stringify(updatedStopsMap));

    localStorage.setItem("orbitlive_user_v3", JSON.stringify(profileData));
    setSavedUser(profileData);
    setSelectedRouteNo(rNo);
    setHomeStopNo(sNo);
    setIsEditingProfile(false);
  }

  function handleLogout() {
    stopLiveLocationSharing(true);
    localStorage.removeItem("orbitlive_user_v3");
    setSavedUser(null);
    setFormName("");
    setFormStopNo("");
    setIsEditingProfile(true);
  }

  // Selected stop object on the login screen for the live preview card
  const formChosenStopObj = useMemo(
    () =>
      formSelectedRoute?.stops.find((s) => s.stopNo === Number(formStopNo)) ||
      null,
    [formSelectedRoute, formStopNo]
  );

  // ==========================================================================
  // VIEW 1: MANDATORY GLASSMORPHIC LOGIN GATE WITH AUTOMATIC DESTINATION PREVIEW
  // ==========================================================================
  if (!savedUser || isEditingProfile) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 bg-slate-100 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 relative overflow-hidden">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-sky-500/10 blur-[110px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-slate-500/10 blur-[110px]" />
        </div>

        <button
          onClick={() => setDarkMode((d) => !d)}
          className="fixed top-4 right-4 z-20 p-2.5 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-sm"
          aria-label="Toggle Theme"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        <div className="relative z-10 w-full max-w-sm rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 shadow-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <OrbitLogo size={42} />
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  OrbitLive
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  SRM Trichy Live Bus Transit
                </p>
              </div>
            </div>

            {savedUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1 hover:bg-rose-500/20 transition"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            )}
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium backdrop-blur-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200/90 dark:border-white/10 focus:outline-none focus:border-sky-500/60"
              />
            </div>

            <GlassDropdown
              label="Bus Number & Route"
              value={formRouteNo}
              options={busDropdownOptions}
              onChange={(val) => {
                const nextRNo = Number(val);
                setFormRouteNo(nextRNo);
                // Restore remembered stop for that bus if available; otherwise ask user to pick
                setFormStopNo(stopByRoute[nextRNo] || "");
              }}
              placeholder="Choose your Bus Number (1-31)"
            />

            <GlassDropdown
              label="Your Home Stop"
              value={formStopNo}
              options={formStopDropdownOptions}
              onChange={(val) => setFormStopNo(Number(val))}
              placeholder="Select your Home Stop on this route"
            />

            {/* AUTOMATIC HOME STOP & DESTINATION PREVIEW BOX (Based on 12:00 PM Rule) */}
            {formChosenStopObj && (
              <div className="p-3.5 rounded-2xl backdrop-blur-xl bg-sky-500/10 border border-sky-500/25 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  <span>
                    {isMorning
                      ? "Morning Ride (Up to 12:00 PM)"
                      : "Evening Ride (After 12:00 PM)"}
                  </span>
                  <span>Auto-Detected</span>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs font-bold">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {isMorning ? "Your Home Stop" : "Starting Point"}
                    </span>
                    <span className="truncate block text-slate-900 dark:text-white">
                      {isMorning ? formChosenStopObj.name : "SRM Trichy Campus"}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-sky-400 shrink-0" />

                  <div className="min-w-0 flex-1 text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Your Destination
                    </span>
                    <span className="truncate block text-emerald-500 dark:text-emerald-400">
                      {isMorning ? "SRM Trichy Campus" : formChosenStopObj.name}
                    </span>
                  </div>
                </div>

                {!isMorning && (
                  <p className="text-[10px] text-slate-400 pt-0.5 border-t border-white/10">
                    Bus Final Terminal Stop:{" "}
                    <strong className="text-slate-200">
                      {formSelectedRoute?.stops?.[0]?.name}
                    </strong>
                  </p>
                )}
              </div>
            )}

            <div className="pt-1 flex items-center gap-2">
              {savedUser && (
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="w-1/3 py-3 rounded-2xl text-xs font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!formName.trim() || !formStopNo}
                className="flex-1 py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-900 dark:bg-sky-500 disabled:opacity-40 hover:opacity-95 text-white dark:text-slate-950 shadow-md transition"
              >
                {savedUser ? "Save Profile" : "Enter OrbitLive"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const busStarted = Boolean(telemetry && telemetry.started);
  const speedPct = busStarted
    ? Math.min(100, Math.round((telemetry.speedKmh / 80) * 100))
    : 0;

  // Student's Chosen Home Stop Object & Live ETA on the Currently Viewed Bus
  const myHomeStopObj =
    currentRoute?.stops.find((s) => s.stopNo === Number(homeStopNo)) ||
    currentRoute?.stops?.[0];

  const myHomeStopEtaObj = telemetry?.stopEtas?.find(
    (e) => e.stopNo === Number(homeStopNo)
  );

  const routeLastStopEvening = currentRoute?.stops?.[0];

  // Destination Logic according to your 12:00 PM Rule:
  // - Up to 12:00 PM (Morning): Destination is ALWAYS SRM Trichy Campus
  // - After 12:00 PM (Evening): Student's Destination is their Home Stop (and bus continues to Last Stop)
  const destinationTitle = isMorning
    ? "SRM TRICHY CAMPUS"
    : myHomeStopObj?.name || "Home Stop";

  const destinationSubtext = busStarted
    ? isMorning
      ? `ETA ${telemetry.routeTerminalEtaMinutes}m (${telemetry.routeTerminalDistanceKm}km) • Arr ${currentRoute?.morningCampusArrival}`
      : myHomeStopEtaObj
      ? myHomeStopEtaObj.passed
        ? `Passed • Bus Last Stop: ${routeLastStopEvening?.name}`
        : `ETA ${myHomeStopEtaObj.etaMinutes}m (${myHomeStopEtaObj.distanceKm}km) • Last: ${routeLastStopEvening?.name}`
      : `Bus Last Stop: ${routeLastStopEvening?.name}`
    : isMorning
    ? `Home: ${myHomeStopObj?.name} (${myHomeStopObj?.morningTime}) → Arr ${currentRoute?.morningCampusArrival}`
    : `Dep SRM ${currentRoute?.eveningCampusDeparture} → Last: ${routeLastStopEvening?.name}`;

  // ==========================================================================
  // VIEW 2: MOBILE-FIRST LIVE RADAR + DUAL BUS/STOP GLASS SWITCHERS
  // ==========================================================================
  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-100 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 overflow-hidden select-none">
      {/* TOP GLASS BAR WITH BUS SWITCHER + YOUR STOP SWITCHER + LOGOUT */}
      <header className="relative z-30 px-3 pt-2.5 pb-2 backdrop-blur-2xl bg-white/85 dark:bg-[#0b101b]/85 border-b border-slate-200/80 dark:border-white/10">
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex items-center justify-between gap-2">
            {/* Logo + Quick Bus Switcher Dropdown */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <OrbitLogo size={34} />
              <div className="flex-1 min-w-0">
                <GlassDropdown
                  compact
                  searchable
                  value={selectedRouteNo}
                  options={busDropdownOptions}
                  onChange={handleSwitchBusOnMap}
                />
              </div>
            </div>

            {/* Profile, Logout & Theme Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setFormName(savedUser.name);
                  setFormRouteNo(selectedRouteNo);
                  setFormStopNo(homeStopNo);
                  setIsEditingProfile(true);
                }}
                title="Edit Profile"
                className="px-2.5 py-2 rounded-xl backdrop-blur-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-white/10 text-xs font-medium flex items-center gap-1 max-w-[92px]"
              >
                <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{savedUser.name.split(" ")[0]}</span>
              </button>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-500 transition"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDarkMode((d) => !d)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200"
                aria-label="Toggle Theme"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {/* Second Compact Row: Your Home Stop Switcher + Automatic Commute Mode Pill */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <GlassDropdown
                compact
                searchable
                value={homeStopNo}
                options={activeRouteStopOptions}
                onChange={handleSwitchStopOnMap}
                placeholder="Select your stop on this bus"
              />
            </div>

            <div className="px-2.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 text-[10px] font-bold text-sky-500 dark:text-sky-400 shrink-0">
              {isMorning ? "🌅 To SRM (<12 PM)" : "🌇 To Home (>12 PM)"}
            </div>
          </div>
        </div>
      </header>

      {/* FULL-VIEW GOOGLE/LEAFLET INTERACTIVE MAP */}
      <div className="relative flex-1 w-full overflow-hidden">
        <LiveMap
          route={currentRoute}
          telemetry={telemetry}
          myCoords={myCoords}
          focusedStop={focusedStop}
          homeStopNo={homeStopNo}
          darkMode={darkMode}
        />
      </div>

      {/* MOBILE BOTTOM GLASS SHEET WITH 4 NEAT GLASS TELEMETRY BOXES */}
      <section className="relative z-30 backdrop-blur-2xl bg-white/90 dark:bg-[#0b101b]/95 border-t border-slate-200/90 dark:border-white/10 rounded-t-3xl shadow-2xl transition-all duration-300">
        <div className="max-w-lg mx-auto px-3.5 pt-2.5 pb-3.5">
          {/* Expand/Collapse Header Bar */}
          <button
            type="button"
            onClick={() => setSheetExpanded((v) => !v)}
            className="w-full flex flex-col items-center justify-center pb-2"
          >
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mb-1.5" />
            <div className="w-full flex items-center justify-between text-left">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Bus #{String(currentRoute?.routeNo || 1).padStart(2, "0")} •{" "}
                    {currentRoute?.routeName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {busStarted
                    ? `Your Stop (${myHomeStopObj?.name}): ${
                        myHomeStopEtaObj?.passed
                          ? "Bus Already Crossed"
                          : `ETA ~${myHomeStopEtaObj?.etaMinutes || 1} min`
                      }`
                    : `Bus Not Started Yet • Morning Start: ${currentRoute?.morningStartTime}`}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                    busStarted
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {busStarted ? "LIVE" : "NOT STARTED"}
                </span>
                <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
                  {sheetExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </span>
              </div>
            </div>
          </button>

          {/* 4 NEAT SMALL GLASS TELEMETRY BOXES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-1.5">
            {/* Box 1: Live Speedometer */}
            <div className="p-2.5 rounded-2xl backdrop-blur-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>Speedometer</span>
                <Gauge className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                  {busStarted ? telemetry.speedKmh : 0}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  km/h
                </span>
              </div>
              <div className="mt-1.5 w-full h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-400 transition-all duration-300"
                  style={{ width: `${speedPct}%` }}
                />
              </div>
            </div>

            {/* Box 2: Current Stop & Timing */}
            <div className="p-2.5 rounded-2xl backdrop-blur-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>Current Stop</span>
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-1 text-xs font-bold text-slate-900 dark:text-white truncate">
                {busStarted ? telemetry.currentStopName : "Not Started Yet"}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {busStarted
                  ? `Stop #${telemetry.currentStopNo} • ${telemetry.currentStopScheduledTime}`
                  : isMorning
                  ? `Starts ${currentRoute?.morningStartTime}`
                  : `Departs SRM ${currentRoute?.eveningCampusDeparture}`}
              </div>
            </div>

            {/* Box 3: Next Stop & Live ETA */}
            <div className="p-2.5 rounded-2xl backdrop-blur-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>Next Stop</span>
                <ArrowRightCircle className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-1 text-xs font-bold text-slate-900 dark:text-white truncate">
                {busStarted
                  ? telemetry.nextStopName
                  : isMorning
                  ? currentRoute?.stops?.[0]?.name
                  : "SRM CAMPUS"}
              </div>
              <div className="mt-0.5 text-[10px] font-semibold text-sky-500 dark:text-sky-400 truncate">
                {busStarted
                  ? `ETA ${telemetry.nextStopEtaMinutes} min (${telemetry.nextStopDistanceKm} km)`
                  : isMorning
                  ? `Scheduled ${currentRoute?.morningStartTime}`
                  : `Scheduled ${currentRoute?.eveningCampusDeparture}`}
              </div>
            </div>

            {/* Box 4: Automatic Destination (SRM Campus <12 PM | Your Home Stop >=12 PM) */}
            <div className="p-2.5 rounded-2xl backdrop-blur-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>{isMorning ? "Destination" : "Your Home Dest"}</span>
                <Flag className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="mt-1 text-xs font-bold text-slate-900 dark:text-white truncate">
                {destinationTitle}
              </div>
              <div className="mt-0.5 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400 truncate">
                {destinationSubtext}
              </div>
            </div>
          </div>

          {/* Share Live Location Button */}
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                isSharing
                  ? stopLiveLocationSharing(true)
                  : startLiveLocationSharing()
              }
              className={`w-full py-2.5 px-4 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition ${
                isSharing
                  ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                  : "bg-slate-900 dark:bg-slate-800 text-white border border-slate-700"
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              {isSharing
                ? `Stop Sharing Bus #${String(selectedRouteNo).padStart(2, "0")}`
                : `Share Live Location for Bus #${String(
                    selectedRouteNo
                  ).padStart(2, "0")}`}
            </button>
          </div>

          {/* Anti-Prank / Out-of-Route Cutoff Banner */}
          {sharingFeedback && (
            <div
              className={`mt-2 px-3 py-2 rounded-xl text-[11px] flex items-center gap-2 border ${
                sharingFeedback.status === "CUTOFF_OUT_OF_ROUTE" ||
                sharingFeedback.status === "CUTOFF_AWAY_FROM_BUS" ||
                sharingFeedback.status === "ERROR"
                  ? "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-300"
                  : sharingFeedback.status === "AUTO_STOPPED_DESTINATION"
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-300"
                  : "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-300"
              }`}
            >
              {sharingFeedback.status === "ACCEPTED_ACTIVE" ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="leading-snug">{sharingFeedback.message}</span>
            </div>
          )}

          {/* EXPANDABLE STOP TIMELINE */}
          {sheetExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 max-h-[38dvh] overflow-y-auto pr-1 space-y-1.5">
              {currentRoute?.stops.map((stop, idx) => {
                const etaObj = telemetry?.stopEtas?.find(
                  (e) => e.stopNo === stop.stopNo
                );
                const isCurrentStop =
                  busStarted && telemetry?.currentStopIndex === idx;
                const isPassed = busStarted && etaObj ? etaObj.passed : false;
                const isMyStop = Number(homeStopNo) === stop.stopNo;
                const isEveningFinalStop = !isMorning && idx === 0;

                return (
                  <button
                    key={stop.stopNo}
                    type="button"
                    onClick={() => {
                      setFocusedStop({ ...stop, ts: Date.now() });
                      setSheetExpanded(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isCurrentStop
                        ? "bg-sky-500/10 border-sky-500/40"
                        : isMyStop
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                          isCurrentStop
                            ? "bg-sky-500 text-slate-950"
                            : isMyStop
                            ? "bg-amber-500 text-slate-950"
                            : isPassed
                            ? "bg-slate-700 text-slate-400"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        {stop.stopNo}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                          <span>{stop.name}</span>
                          {isMyStop && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold">
                              {isMorning ? "Your Pickup" : "Your Drop"}
                            </span>
                          )}
                          {isEveningFinalStop && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                              Evening Last Stop
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>Morning {stop.morningTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {busStarted && etaObj ? (
                        <span
                          className={`text-xs font-bold ${
                            isCurrentStop
                              ? "text-emerald-400"
                              : isPassed
                              ? "text-slate-500 line-through"
                              : "text-sky-400"
                          }`}
                        >
                          {isCurrentStop
                            ? "At Stop"
                            : isPassed
                            ? "Passed"
                            : `${etaObj.etaMinutes} min`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {stop.morningTime}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}