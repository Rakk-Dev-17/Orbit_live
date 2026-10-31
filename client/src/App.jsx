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
  ArrowRight,
  Bell,
  Phone,
  Shield,
  Truck,
  GraduationCap,
  Plus,
  Trash2,
  Edit3,
  Users,
  Radio,
  Megaphone,
  Save,
  X,
  Eye,
  EyeOff,
  History
} from "lucide-react";
import LiveMap from "./components/LiveMap.jsx";

const DEFAULT_ADMINS = [
  { id: "admin_1", label: "Admin 1 - Pavithrraraj", name: "Pavithrraraj" },
  { id: "admin_2", label: "Admin 2 - Jeffrey", name: "Jeffrey" },
  { id: "admin_3", label: "Admin 3 - Rakshan Kumaraa", name: "Rakshan Kumaraa" }
];

// ============================================================================
// 1. ORBITLIVE-ONLY AUTOFILL VAULT (Blocks Chrome/Gmail Autofill Completely)
// ============================================================================
const AUTOFILL_STORAGE_KEY = "orbitlive_autofill_vault_v1";

function getOrbitAutofillList(category) {
  try {
    const raw = localStorage.getItem(AUTOFILL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return Array.isArray(parsed[category]) ? parsed[category] : [];
  } catch {
    return [];
  }
}

function saveToOrbitAutofill(category, value) {
  const clean = String(value || "").trim();
  if (!clean) return;
  try {
    const raw = localStorage.getItem(AUTOFILL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const existing = Array.isArray(parsed[category]) ? parsed[category] : [];
    const updated = [clean, ...existing.filter((item) => item !== clean)].slice(0, 6);
    parsed[category] = updated;
    localStorage.setItem(AUTOFILL_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage error
  }
}

function removeFromOrbitAutofill(category, value) {
  try {
    const raw = localStorage.getItem(AUTOFILL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const existing = Array.isArray(parsed[category]) ? parsed[category] : [];
    parsed[category] = existing.filter((item) => item !== value);
    localStorage.setItem(AUTOFILL_STORAGE_KEY, JSON.stringify(parsed));
    return parsed[category];
  } catch {
    return [];
  }
}

function OrbitInput({
  label,
  value,
  onChange,
  placeholder,
  historyCategory,
  required = false,
  inputMode = "text"
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [focused, setFocused] = useState(false);
  const [historyItems, setHistoryItems] = useState(() =>
    historyCategory ? getOrbitAutofillList(historyCategory) : []
  );
  const containerRef = useRef(null);

  useEffect(() => {
    if (historyCategory) {
      setHistoryItems(getOrbitAutofillList(historyCategory));
    }
  }, [historyCategory, focused]);

  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  const filteredSuggestions = useMemo(() => {
    const q = String(value || "").trim().toLowerCase();
    if (!q) return historyItems;
    return historyItems.filter(
      (item) => item.toLowerCase().includes(q) && item !== value
    );
  }, [historyItems, value]);

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          {label}
        </label>
      )}

      <input
        type="text"
        inputMode={inputMode}
        required={required}
        readOnly={!unlocked}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        data-lpignore="true"
        data-1p-ignore="true"
        data-form-type="other"
        name={`orbit_custom_${historyCategory || "field"}`}
        value={value}
        onMouseDown={() => setUnlocked(true)}
        onTouchStart={() => setUnlocked(true)}
        onFocus={() => {
          setUnlocked(true);
          setFocused(true);
        }}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium backdrop-blur-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200/90 dark:border-white/10 focus:outline-none focus:border-sky-500/60"
      />

      {focused && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 rounded-2xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-white/15 shadow-2xl overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <History className="w-3 h-3 text-sky-400" />
            <span>Saved in OrbitLive</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredSuggestions.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between px-3.5 py-2.5 hover:bg-sky-500/10 transition"
              >
                <button
                  type="button"
                  onClick={() => {
                    onChange(item);
                    setFocused(false);
                  }}
                  className="flex-1 text-left text-xs font-semibold text-slate-800 dark:text-slate-100 truncate"
                >
                  {item}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextList = removeFromOrbitAutofill(historyCategory, item);
                    setHistoryItems(nextList);
                  }}
                  title="Remove from OrbitLive history"
                  className="p-1 text-slate-400 hover:text-rose-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrbitPasswordInput({ label, value, onChange, placeholder }) {
  const [unlocked, setUnlocked] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          required
          readOnly={!unlocked}
          autoComplete="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
          style={{ WebkitTextSecurity: visible ? "none" : "disc" }}
          value={value}
          onMouseDown={() => setUnlocked(true)}
          onTouchStart={() => setUnlocked(true)}
          onFocus={() => setUnlocked(true)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-4 pr-10 py-3 rounded-2xl text-xs sm:text-sm font-mono backdrop-blur-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200/90 dark:border-white/10 focus:outline-none focus:border-sky-500/60"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          tabIndex={-1}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function checkIsMorning() {
  return new Date().getHours() < 12;
}

function getDistanceMetersClient(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function triggerCommuterAlert(title, body) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    }
  } catch {
    // Ignore audio context restriction
  }

  if ("vibrate" in navigator) {
    navigator.vibrate([300, 150, 300]);
  }

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

// ============================================================================
// 2. ORBITLIVE GEOMETRIC SVG LOGO
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
// 3. FROSTED-GLASS DROPDOWN BOX COMPONENT
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
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter options..."
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
// 4. ADMIN COMMAND CENTER VIEW
// ============================================================================
function AdminDashboard({
  adminUser,
  darkMode,
  setDarkMode,
  onLogout,
  onOpenLiveMap
}) {
  const [snapshot, setSnapshot] = useState(null);
  const [selectedEditRouteNo, setSelectedEditRouteNo] = useState(1);
  const [editRouteState, setEditRouteState] = useState(null);
  const [newStopForm, setNewStopForm] = useState({
    name: "",
    morningTime: "07:45 AM",
    lat: "10.8500",
    lng: "78.7100"
  });
  const [newBusModalOpen, setNewBusModalOpen] = useState(false);
  const [newBusForm, setNewBusForm] = useState({
    routeNo: 32,
    routeName: "",
    morningStartTime: "07:30 AM",
    morningCampusArrival: "08:45 AM",
    eveningCampusDeparture: "04:35 PM",
    driverPassword: "BUS32",
    driverPhone: ""
  });
  const [announcementInput, setAnnouncementInput] = useState("");
  const [adminToast, setAdminToast] = useState("");

  const adminHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-admin-token": adminUser?.adminToken || ""
    }),
    [adminUser?.adminToken]
  );

  function fetchOverview() {
    fetch("/api/admin/overview", { headers: adminHeaders })
      .then((r) => r.json())
      .then((data) => {
        if (data?.routes) {
          setSnapshot(data);
          if (!editRouteState && data.routes.length > 0) {
            const target =
              data.routes.find((r) => r.routeNo === Number(selectedEditRouteNo)) ||
              data.routes[0];
            setEditRouteState(JSON.parse(JSON.stringify(target)));
          }
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchOverview();
    const timer = setInterval(fetchOverview, 2500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectRouteToEdit(rNo) {
    setSelectedEditRouteNo(Number(rNo));
    const found = snapshot?.routes?.find((r) => r.routeNo === Number(rNo));
    if (found) {
      setEditRouteState(JSON.parse(JSON.stringify(found)));
    }
  }

  function showToast(msg) {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(""), 3500);
  }

  function handleSaveBusChanges() {
    if (!editRouteState) return;
    fetch(`/api/admin/bus/${editRouteState.routeNo}`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify(editRouteState)
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setSnapshot(res.snapshot);
          showToast(`Saved changes to Bus #${editRouteState.routeNo}`);
        }
      });
  }

  function handleAddStopToRoute() {
    if (!newStopForm.name.trim() || !editRouteState) return;
    const updatedStops = [...(editRouteState.stops || [])];
    const insertIdx = Math.max(0, updatedStops.length - 1);
    updatedStops.splice(insertIdx, 0, {
      stopNo: insertIdx + 1,
      name: newStopForm.name.trim().toUpperCase(),
      morningTime: newStopForm.morningTime,
      lat: Number(newStopForm.lat) || 10.85,
      lng: Number(newStopForm.lng) || 78.71
    });

    const renumbered = updatedStops.map((s, i) => ({ ...s, stopNo: i + 1 }));
    setEditRouteState({ ...editRouteState, stops: renumbered });
    setNewStopForm({ name: "", morningTime: "07:45 AM", lat: "10.8500", lng: "78.7100" });
  }

  function handleDeleteStop(stopIdx) {
    if (!editRouteState) return;
    const filtered = editRouteState.stops
      .filter((_, idx) => idx !== stopIdx)
      .map((s, i) => ({ ...s, stopNo: i + 1 }));
    setEditRouteState({ ...editRouteState, stops: filtered });
  }

  function handleCreateNewBus(e) {
    e.preventDefault();
    fetch("/api/admin/bus", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(newBusForm)
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setSnapshot(res.snapshot);
          setNewBusModalOpen(false);
          handleSelectRouteToEdit(newBusForm.routeNo);
          showToast(`Added Bus #${newBusForm.routeNo} to fleet`);
        } else {
          showToast(res.message || "Could not create bus");
        }
      });
  }

  function handleDeleteBus(routeNo) {
    fetch(`/api/admin/bus/${routeNo}`, {
      method: "DELETE",
      headers: adminHeaders
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setSnapshot(res.snapshot);
          if (res.snapshot.routes.length > 0) {
            const first = res.snapshot.routes[0];
            setSelectedEditRouteNo(first.routeNo);
            setEditRouteState(JSON.parse(JSON.stringify(first)));
          }
          showToast(`Deleted Bus #${routeNo}`);
        }
      });
  }

  function handleKickSharer(routeNo, userId) {
    fetch("/api/admin/kick-sharer", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ routeNo, userId })
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setSnapshot(res.snapshot);
          showToast("Stopped location sharing for user");
        }
      });
  }

  function handleSendAnnouncement(clear = false) {
    fetch("/api/admin/announcement", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        text: clear ? "" : announcementInput,
        byAdmin: adminUser.name
      })
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setSnapshot(res.snapshot);
          if (clear) setAnnouncementInput("");
          showToast(clear ? "Cleared campus banner" : "Broadcast sent to all users");
        }
      });
  }

  const busOptions = useMemo(
    () =>
      (snapshot?.routes || []).map((r) => ({
        value: r.routeNo,
        label: `Bus #${String(r.routeNo).padStart(2, "0")} — ${r.routeName}`,
        sublabel: `${r.stops?.length || 0} Stops • Driver Pass: ${
          r.driverPassword || `BUS${r.routeNo}`
        }${r.driverPhone ? ` • 📞 ${r.driverPhone}` : ""}`
      })),
    [snapshot?.routes]
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 pb-12">
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/85 dark:bg-[#0b101b]/90 border-b border-slate-200 dark:border-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <OrbitLogo size={38} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base">OrbitLive Admin Console</h1>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  {adminUser.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-Time Fleet, Concurrency, Primary Source & Stop Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenLiveMap}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30 hover:bg-sky-500/25 transition"
            >
              Open Live Radar Map
            </button>
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {adminToast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-xl">
          {adminToast}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 pt-5 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Concurrent Users</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono mt-1">
              {snapshot?.totalConcurrentUsers || 1}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Students: {snapshot?.studentCount || 0} • Drivers:{" "}
              {snapshot?.driverCount || 0} • Admins: {snapshot?.adminCount || 1}
            </p>
          </div>

          <div className="p-4 rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Active GPS Sharers</span>
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono mt-1 text-emerald-400">
              {snapshot?.totalSharingUsers || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Broadcasting across {snapshot?.activeBusesCount || 0} active buses
            </p>
          </div>

          <div className="p-4 rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Total Fleet Buses</span>
              <Truck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono mt-1">
              {snapshot?.totalBusesCount || 31}
            </div>
            <button
              onClick={() => {
                const nextNo =
                  (snapshot?.routes?.[snapshot.routes.length - 1]?.routeNo || 31) + 1;
                setNewBusForm({
                  ...newBusForm,
                  routeNo: nextNo,
                  driverPassword: `BUS${nextNo}`
                });
                setNewBusModalOpen(true);
              }}
              className="mt-1 text-[11px] font-bold text-sky-400 flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3 h-3" /> Add New Bus Route
            </button>
          </div>

          <div className="p-4 rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Campus Broadcast</span>
              <Megaphone className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <input
                type="text"
                autoComplete="off"
                value={announcementInput}
                onChange={(e) => setAnnouncementInput(e.target.value)}
                placeholder="Send alert to all buses..."
                className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
              />
              <button
                onClick={() => handleSendAnnouncement(false)}
                className="px-2.5 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs shrink-0"
              >
                Send
              </button>
              {snapshot?.announcement && (
                <button
                  onClick={() => handleSendAnnouncement(true)}
                  className="p-1.5 rounded-xl bg-rose-500/15 text-rose-400"
                  title="Clear Broadcast"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ACTIVE PRIMARY SHARER INSPECTOR */}
        <div className="p-5 rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>Active Buses & Primary Location Source Inspector</span>
          </h2>

          {!snapshot?.activeBusPrimaryList?.length ? (
            <p className="text-xs text-slate-400 py-3">
              No buses have active GPS sharers right now. As soon as a student or
              driver shares location on any bus, the primary device appears here.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {snapshot.activeBusPrimaryList.map((b) => (
                <div
                  key={b.routeNo}
                  className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-sky-400">
                      Bus #{String(b.routeNo).padStart(2, "0")} — {b.routeName}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                      {b.speedKmh} km/h • {b.totalSharersOnBus} Sharing
                    </span>
                  </div>

                  {b.driverPhone && (
                    <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
                      <span className="font-semibold">
                        Driver ({b.driverName || "Driver"}):{" "}
                        <strong className="font-mono text-emerald-400">
                          {b.driverPhone}
                        </strong>
                      </span>
                      <a
                        href={`tel:${b.driverPhone}`}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px]"
                      >
                        Call Driver
                      </a>
                    </div>
                  )}

                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/80 border border-sky-500/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-sky-400 block">
                        ★ Primary Location Source (Nearest to Route)
                      </span>
                      <span className="font-bold">
                        {b.primaryUserName} ({b.primaryRole})
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        • {b.distanceToRouteMeters}m from route path
                      </span>
                    </div>
                    <button
                      onClick={() => handleKickSharer(b.routeNo, b.primaryUserId)}
                      className="px-2 py-1 rounded-lg bg-rose-500/15 text-rose-400 text-[10px] font-bold hover:bg-rose-500/25"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BUS ROUTE & STOP EDITOR */}
        <div className="p-5 rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-sky-400" />
              <span>Bus Route, Driver Password & Stop Editor</span>
            </h2>

            <div className="w-full sm:w-80">
              <GlassDropdown
                compact
                value={selectedEditRouteNo}
                options={busOptions}
                onChange={handleSelectRouteToEdit}
              />
            </div>
          </div>

          {editRouteState && (
            <div className="space-y-4 pt-2">
              {editRouteState.driverPhone && (
                <div className="px-3.5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>
                      Assigned Driver Contact ({editRouteState.driverName || "Driver"}):{" "}
                      <strong className="font-mono text-emerald-400">
                        {editRouteState.driverPhone}
                      </strong>
                    </span>
                  </div>
                  <a
                    href={`tel:${editRouteState.driverPhone}`}
                    className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    Call Driver
                  </a>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Route Name
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={editRouteState.routeName}
                    onChange={(e) =>
                      setEditRouteState({
                        ...editRouteState,
                        routeName: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Morning Start Time
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={editRouteState.morningStartTime}
                    onChange={(e) =>
                      setEditRouteState({
                        ...editRouteState,
                        morningStartTime: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    SRM Arrival Time
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={editRouteState.morningCampusArrival}
                    onChange={(e) =>
                      setEditRouteState({
                        ...editRouteState,
                        morningCampusArrival: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Driver Login Password
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={editRouteState.driverPassword || `BUS${editRouteState.routeNo}`}
                    onChange={(e) =>
                      setEditRouteState({
                        ...editRouteState,
                        driverPassword: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-mono font-bold text-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Driver Phone (Public)
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. 9876543210"
                    value={editRouteState.driverPhone || ""}
                    onChange={(e) =>
                      setEditRouteState({
                        ...editRouteState,
                        driverPhone: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Stops on Bus #{editRouteState.routeNo} ({editRouteState.stops?.length} Stops)
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {editRouteState.stops?.map((stop, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/5 text-xs"
                    >
                      <div className="col-span-1 font-bold text-center text-sky-400">
                        #{idx + 1}
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          autoComplete="off"
                          value={stop.name}
                          onChange={(e) => {
                            const nextStops = [...editRouteState.stops];
                            nextStops[idx].name = e.target.value;
                            setEditRouteState({ ...editRouteState, stops: nextStops });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-semibold"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          autoComplete="off"
                          value={stop.morningTime}
                          onChange={(e) => {
                            const nextStops = [...editRouteState.stops];
                            nextStops[idx].morningTime = e.target.value;
                            setEditRouteState({ ...editRouteState, stops: nextStops });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.0001"
                          value={stop.lat}
                          onChange={(e) => {
                            const nextStops = [...editRouteState.stops];
                            nextStops[idx].lat = Number(e.target.value);
                            setEditRouteState({ ...editRouteState, stops: nextStops });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-mono text-[11px]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.0001"
                          value={stop.lng}
                          onChange={(e) => {
                            const nextStops = [...editRouteState.stops];
                            nextStops[idx].lng = Number(e.target.value);
                            setEditRouteState({ ...editRouteState, stops: nextStops });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-mono text-[11px]"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteStop(idx)}
                          className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
                          title="Delete Stop"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-2xl bg-sky-500/5 border border-sky-500/20 flex flex-wrap items-center gap-2 text-xs">
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="New Stop Name (e.g. TOLGATE)"
                    value={newStopForm.name}
                    onChange={(e) =>
                      setNewStopForm({ ...newStopForm, name: e.target.value })
                    }
                    className="flex-1 min-w-[150px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                  />
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Time (07:45 AM)"
                    value={newStopForm.morningTime}
                    onChange={(e) =>
                      setNewStopForm({ ...newStopForm, morningTime: e.target.value })
                    }
                    className="w-28 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lat"
                    value={newStopForm.lat}
                    onChange={(e) =>
                      setNewStopForm({ ...newStopForm, lat: e.target.value })
                    }
                    className="w-28 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-mono"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lng"
                    value={newStopForm.lng}
                    onChange={(e) =>
                      setNewStopForm({ ...newStopForm, lng: e.target.value })
                    }
                    className="w-28 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddStopToRoute}
                    className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Stop
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => handleDeleteBus(editRouteState.routeNo)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Bus #{editRouteState.routeNo}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveBusChanges}
                  className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-sky-500 text-slate-950 shadow-lg flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Bus #{editRouteState.routeNo} & Sync Live</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {newBusModalOpen && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-slate-950/70 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewBus}
            autoComplete="off"
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 space-y-4 text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Add New Bus to SRM Fleet</h3>
              <button
                type="button"
                onClick={() => setNewBusModalOpen(false)}
                className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  Bus Number
                </label>
                <input
                  type="number"
                  required
                  value={newBusForm.routeNo}
                  onChange={(e) =>
                    setNewBusForm({
                      ...newBusForm,
                      routeNo: Number(e.target.value),
                      driverPassword: `BUS${e.target.value}`
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  Driver Password
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  required
                  value={newBusForm.driverPassword}
                  onChange={(e) =>
                    setNewBusForm({ ...newBusForm, driverPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-400 mb-1">
                Route Name (Starting Area)
              </label>
              <input
                type="text"
                autoComplete="off"
                required
                placeholder="e.g. CENTRAL BUS STAND - JUNCTION"
                value={newBusForm.routeName}
                onChange={(e) =>
                  setNewBusForm({ ...newBusForm, routeName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  Morning Start
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={newBusForm.morningStartTime}
                  onChange={(e) =>
                    setNewBusForm({
                      ...newBusForm,
                      morningStartTime: e.target.value
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  Driver Phone (Optional)
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="9876543210"
                  value={newBusForm.driverPhone}
                  onChange={(e) =>
                    setNewBusForm({ ...newBusForm, driverPhone: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-sky-500 text-slate-950 font-bold"
            >
              Create Bus Route
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. MAIN APPLICATION
// ============================================================================
export default function App() {
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

  const [isMorning, setIsMorning] = useState(checkIsMorning);
  useEffect(() => {
    const timer = setInterval(() => setIsMorning(checkIsMorning()), 15000);
    return () => clearInterval(timer);
  }, []);

  const [savedUser, setSavedUser] = useState(() => {
    const raw = localStorage.getItem("orbitlive_user_v4");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

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
  const [loginRoleTab, setLoginRoleTab] = useState(
    savedUser?.role || "STUDENT"
  );
  const [adminViewMapMode, setAdminViewMapMode] = useState(false);
  const [authError, setAuthError] = useState("");

  // Student Login Form
  const [formName, setFormName] = useState(savedUser?.name || "");
  const [formRouteNo, setFormRouteNo] = useState(savedUser?.routeNo || 28);
  const [formStopNo, setFormStopNo] = useState(savedUser?.homeStopNo || 1);

  // Driver Login Form
  const [driverNameInput, setDriverNameInput] = useState(
    savedUser?.role === "DRIVER" ? savedUser.name : ""
  );
  const [driverRouteNo, setDriverRouteNo] = useState(
    savedUser?.role === "DRIVER" ? savedUser.routeNo : 28
  );
  const [driverPasswordInput, setDriverPasswordInput] = useState("");
  const [driverPhoneInput, setDriverPhoneInput] = useState(
    savedUser?.driverPhone || ""
  );

  // Admin Login Form
  const [adminsList, setAdminsList] = useState(DEFAULT_ADMINS);
  const [selectedAdminId, setSelectedAdminId] = useState("admin_1");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");

  // Fleet & Map States
  const [routes, setRoutes] = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const [selectedRouteNo, setSelectedRouteNo] = useState(
    savedUser?.routeNo || 28
  );
  const [homeStopNo, setHomeStopNo] = useState(savedUser?.homeStopNo || 1);

  const [telemetry, setTelemetry] = useState(null);
  const [activeBuses, setActiveBuses] = useState([]);
  const [isSharing, setIsSharing] = useState(false);

  // Real Hardware GPS State (No fake SRM_TRICHY_CAMPUS override!)
  const [myCoords, setMyCoords] = useState(() => {
    try {
      const cached = localStorage.getItem("orbitlive_last_real_gps");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [gpsStatus, setGpsStatus] = useState("Locating your GPS...");
  const [sharingFeedback, setSharingFeedback] = useState(null);
  const [proximityAlertBanner, setProximityAlertBanner] = useState(null);
  const [focusedStop, setFocusedStop] = useState(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const socketRef = useRef(null);
  const prevGpsRef = useRef(null);
  const isSharingRef = useRef(false);
  const alertedStateRef = useRef({
    nextStopAlertedForRoute: null,
    delayAlertedForRoute: null
  });

  useEffect(() => {
    isSharingRef.current = isSharing;
  }, [isSharing]);

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
    userName: savedUser?.name || "Student",
    role: savedUser?.role || "STUDENT",
    driverToken: savedUser?.driverToken || "",
    driverPhone: savedUser?.driverPhone || "",
    myCoords
  });

  useEffect(() => {
    latestConfigRef.current = {
      selectedRouteNo,
      homeStopNo,
      userName: savedUser?.name || "Student",
      role: savedUser?.role || "STUDENT",
      driverToken: savedUser?.driverToken || "",
      driverPhone: savedUser?.driverPhone || "",
      myCoords
    };
  }, [selectedRouteNo, homeStopNo, savedUser, myCoords]);

  // ==========================================================================
  // 1-SECOND REAL HARDWARE GPS ENGINE (Updates "📍 YOU" Every Second as You Move)
  // ==========================================================================
  function applyHardwareGpsPosition(pos) {
    const { latitude, longitude, accuracy, speed } = pos.coords;
    const now = Date.now();

    // Calculate real movement speed if mobile OS returns speed === null
    let computedSpeedKmh =
      speed !== null && speed !== undefined && speed >= 0.4
        ? Math.round(speed * 3.6)
        : 0;

    if (computedSpeedKmh === 0 && prevGpsRef.current) {
      const dtSec = Math.max(0.5, (now - prevGpsRef.current.ts) / 1000);
      const distM = getDistanceMetersClient(
        prevGpsRef.current.lat,
        prevGpsRef.current.lng,
        latitude,
        longitude
      );
      if (distM > 2.5 && dtSec <= 10) {
        const derived = Math.round((distM / dtSec) * 3.6);
        if (derived <= 120) computedSpeedKmh = derived;
      }
    }

    prevGpsRef.current = { lat: latitude, lng: longitude, ts: now };

    const nextCoord = {
      lat: Number(latitude.toFixed(6)),
      lng: Number(longitude.toFixed(6)),
      accuracy: Math.round(accuracy || 10),
      speedKmh: computedSpeedKmh,
      ts: now
    };

    setMyCoords(nextCoord);
    setGpsStatus("Live GPS Locked");
    try {
      localStorage.setItem("orbitlive_last_real_gps", JSON.stringify(nextCoord));
    } catch {
      // Ignore storage error
    }

    // If user is currently broadcasting to a bus, transmit their new coordinate immediately
    if (isSharingRef.current) {
      transmitLocationPing(
        nextCoord.lat,
        nextCoord.lng,
        nextCoord.accuracy,
        nextCoord.speedKmh
      );
    }
  }

  function requestFreshHardwareGps() {
    if (!("geolocation" in navigator)) {
      setGpsStatus("Geolocation not supported by browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      applyHardwareGpsPosition,
      (err) => {
        setGpsStatus(`Enable Location Permission (${err.message})`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8000
      }
    );
  }

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("Geolocation not supported");
      return;
    }

    // 1. Immediate lock on mount
    requestFreshHardwareGps();

    // 2. Continuous hardware watcher
    const watchId = navigator.geolocation.watchPosition(
      applyHardwareGpsPosition,
      (err) => {
        setGpsStatus(`GPS Permission Required (${err.message})`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8000
      }
    );

    // 3. 1-Second active poll so phones & laptops refresh movement every single second
    const oneSecondGpsTimer = setInterval(() => {
      if (document.hidden) return;
      navigator.geolocation.getCurrentPosition(
        applyHardwareGpsPosition,
        () => {},
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 4000
        }
      );
    }, 1000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(oneSecondGpsTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetch("/api/routes")
      .then((res) => res.json())
      .then((data) => {
        setRoutes(data.routes || []);
        if (data.admins?.length) setAdminsList(data.admins);
        if (data.announcement) setAnnouncement(data.announcement);
        if (typeof data.isMorningIST === "boolean") {
          setIsMorning(data.isMorningIST);
        }
      })
      .catch((err) => console.error("Failed to load SRM routes:", err));
  }, []);

  useEffect(() => {
    const socket = io({
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      const cfg = latestConfigRef.current;
      socket.emit("register_presence", {
        clientId: userIdRef.current,
        name: cfg.userName,
        role: cfg.role,
        routeNo: cfg.selectedRouteNo
      });
      socket.emit("join_route", { routeNo: cfg.selectedRouteNo });
    });

    socket.on("routes_updated", (updatedRoutes) => {
      if (Array.isArray(updatedRoutes)) setRoutes(updatedRoutes);
    });

    socket.on("announcement_update", (ann) => {
      setAnnouncement(ann || null);
    });

    socket.on("bus_telemetry_update", (data) => {
      if (
        Number(data.routeNo) === Number(latestConfigRef.current.selectedRouteNo)
      ) {
        if (typeof data.isMorning === "boolean") setIsMorning(data.isMorning);
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

    const pollTimer = setInterval(() => {
      if (document.hidden) return;
      const cfg = latestConfigRef.current;
      fetch(`/api/telemetry/${cfg.selectedRouteNo}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.telemetry) {
            setTelemetry(data.telemetry.started ? data.telemetry : null);
          }
          if (data?.announcement !== undefined) {
            setAnnouncement(data.announcement);
          }
          if (Array.isArray(data?.activeBuses)) {
            setActiveBuses(data.activeBuses);
          }
        })
        .catch(() => {});
    }, 2000);

    const presenceTimer = setInterval(() => {
      if (document.hidden) return;
      const cfg = latestConfigRef.current;
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: userIdRef.current,
          name: cfg.userName,
          role: cfg.role,
          routeNo: cfg.selectedRouteNo
        })
      }).catch(() => {});
    }, 25000);

    return () => {
      clearInterval(pollTimer);
      clearInterval(presenceTimer);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    setTelemetry(null);
    setProximityAlertBanner(null);
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

  useEffect(() => {
    if (!telemetry || !telemetry.started || !currentRoute) return;

    const myStopObj = currentRoute.stops.find(
      (s) => s.stopNo === Number(homeStopNo)
    );

    const isNextStopMyHomeStop =
      Number(telemetry.nextStopNo) === Number(homeStopNo) &&
      Number(telemetry.currentStopNo) !== Number(homeStopNo);

    if (isNextStopMyHomeStop && myStopObj) {
      const alertKey = `${telemetry.routeNo}_next_${homeStopNo}_${telemetry.currentStopNo}`;
      const msg = `Alert: Bus #${String(telemetry.routeNo).padStart(
        2,
        "0"
      )} is at ${telemetry.currentStopName}. Your stop (${
        myStopObj.name
      }) is the NEXT STOP (ETA ~${telemetry.nextStopEtaMinutes} min)!`;

      setProximityAlertBanner({ type: "PROXIMITY", message: msg });

      if (alertedStateRef.current.nextStopAlertedForRoute !== alertKey) {
        alertedStateRef.current.nextStopAlertedForRoute = alertKey;
        triggerCommuterAlert(`🚌 Bus #${telemetry.routeNo} Approaching!`, msg);
      }
    } else if (
      Number(telemetry.currentStopNo) === Number(homeStopNo) &&
      myStopObj
    ) {
      setProximityAlertBanner({
        type: "ARRIVED",
        message: `Bus #${String(telemetry.routeNo).padStart(
          2,
          "0"
        )} is currently at your stop (${myStopObj.name})!`
      });
    } else if (
      telemetry.delayStatus === "DELAYED" &&
      telemetry.delayMinutes >= 5
    ) {
      const delayKey = `${telemetry.routeNo}_delay_${telemetry.currentStopNo}`;
      const delayMsg = `Delay Alert: Bus #${String(
        telemetry.routeNo
      ).padStart(2, "0")} is running +${
        telemetry.delayMinutes
      } mins behind schedule near ${telemetry.currentStopName}.`;

      setProximityAlertBanner({ type: "DELAY", message: delayMsg });

      if (alertedStateRef.current.delayAlertedForRoute !== delayKey) {
        alertedStateRef.current.delayAlertedForRoute = delayKey;
        triggerCommuterAlert(`⏳ Bus #${telemetry.routeNo} Delayed`, delayMsg);
      }
    } else {
      setProximityAlertBanner(null);
    }
  }, [telemetry, homeStopNo, currentRoute]);

  function handleSwitchBusOnMap(newRouteNo) {
    const rNo = Number(newRouteNo);
    setSelectedRouteNo(rNo);

    if (savedUser && Number(savedUser.routeNo) === rNo) {
      setHomeStopNo(savedUser.homeStopNo || 1);
    } else if (stopByRoute[rNo]) {
      setHomeStopNo(stopByRoute[rNo]);
    } else {
      const targetRoute = routes.find((r) => r.routeNo === rNo);
      if (targetRoute && targetRoute.stops.length > 0) {
        setHomeStopNo(targetRoute.stops[0].stopNo);
      }
    }
  }

  function handleSwitchStopOnMap(newStopNo) {
    const sNo = Number(newStopNo);
    setHomeStopNo(sNo);

    const updatedMap = { ...stopByRoute, [selectedRouteNo]: sNo };
    setStopByRoute(updatedMap);
    localStorage.setItem("orbitlive_stops_map", JSON.stringify(updatedMap));

    if (savedUser && Number(savedUser.routeNo) === Number(selectedRouteNo)) {
      const stopObj = currentRoute?.stops.find((s) => s.stopNo === sNo);
      const updatedUser = {
        ...savedUser,
        homeStopNo: sNo,
        homeStopName: stopObj?.name || savedUser.homeStopName
      };
      setSavedUser(updatedUser);
      localStorage.setItem("orbitlive_user_v4", JSON.stringify(updatedUser));
    }
  }

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

  const formStopDropdownOptions = useMemo(() => {
    if (!formSelectedRoute) return [];
    return formSelectedRoute.stops.slice(0, -1).map((s) => ({
      value: s.stopNo,
      label: `Stop #${s.stopNo} — ${s.name}`,
      sublabel: `Morning Timing: ${s.morningTime}`
    }));
  }, [formSelectedRoute]);

  const activeRouteStopOptions = useMemo(() => {
    if (!currentRoute) return [];
    return currentRoute.stops.slice(0, -1).map((s) => ({
      value: s.stopNo,
      label: `Your Stop: #${s.stopNo} ${s.name}`,
      sublabel: `Scheduled: ${s.morningTime}`
    }));
  }, [currentRoute]);

  const adminDropdownOptions = useMemo(
    () =>
      adminsList.map((a) => ({
        value: a.id,
        label: a.label,
        sublabel: "SRM OrbitLive System Administrator"
      })),
    [adminsList]
  );

  function transmitLocationPing(
    lat,
    lng,
    accuracy = 10,
    speedKmh = 0,
    overrideRouteNo = null
  ) {
    const cfg = latestConfigRef.current;
    const payload = {
      routeNo: overrideRouteNo || cfg.selectedRouteNo,
      userId: userIdRef.current,
      userName: cfg.userName,
      role: cfg.role,
      driverToken: cfg.driverToken,
      driverPhone: cfg.driverPhone,
      lat,
      lng,
      accuracy,
      speedKmh: Math.max(0, Math.round(Number(speedKmh) || 0)),
      homeStopNo: cfg.homeStopNo
    };

    socketRef.current?.emit("student_location_ping", payload);

    fetch("/api/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((r) => r.json())
      .then((res) => {
        if (res?.sharingStatus) {
          setSharingFeedback(res.sharingStatus);
          if (
            res.sharingStatus.status === "CUTOFF_OUT_OF_ROUTE" ||
            res.sharingStatus.status === "CUTOFF_AWAY_FROM_BUS" ||
            res.sharingStatus.status === "AUTO_STOPPED_DESTINATION"
          ) {
            setIsSharing(false);
            isSharingRef.current = false;
          }
        }
        if (res?.telemetry && res.telemetry.started) {
          setTelemetry(res.telemetry);
        }
      })
      .catch(() => {});
  }

  function startLiveLocationSharing() {
    if (!myCoords?.lat || !myCoords?.lng) {
      requestFreshHardwareGps();
      setSharingFeedback({
        status: "ERROR",
        message: "Acquiring your real GPS location first — please allow location access."
      });
      return;
    }

    setIsSharing(true);
    isSharingRef.current = true;
    transmitLocationPing(
      myCoords.lat,
      myCoords.lng,
      myCoords.accuracy || 10,
      myCoords.speedKmh || 0
    );
  }

  function stopLiveLocationSharing(clearMessage = true) {
    const rNo = latestConfigRef.current.selectedRouteNo;
    socketRef.current?.emit("stop_sharing", {
      routeNo: rNo,
      userId: userIdRef.current
    });
    fetch("/api/stop-sharing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routeNo: rNo, userId: userIdRef.current })
    }).catch(() => {});

    setIsSharing(false);
    isSharingRef.current = false;
    if (clearMessage) setSharingFeedback(null);
  }

  function handleStudentLoginSubmit(e) {
    e.preventDefault();
    setAuthError("");
    if (!formName.trim() || !formStopNo) return;

    saveToOrbitAutofill("studentNames", formName.trim());

    const selectedStopObj =
      formSelectedRoute?.stops.find(
        (s) => s.stopNo === Number(formStopNo)
      ) || formSelectedRoute?.stops[0];

    const rNo = Number(formRouteNo);
    const sNo = Number(selectedStopObj.stopNo);

    const profileData = {
      role: "STUDENT",
      name: formName.trim(),
      routeNo: rNo,
      routeName: formSelectedRoute?.routeName || "",
      homeStopNo: sNo,
      homeStopName: selectedStopObj?.name || ""
    };

    const updatedStopsMap = { ...stopByRoute, [rNo]: sNo };
    setStopByRoute(updatedStopsMap);
    localStorage.setItem("orbitlive_stops_map", JSON.stringify(updatedStopsMap));

    localStorage.setItem("orbitlive_user_v4", JSON.stringify(profileData));
    setSavedUser(profileData);
    setSelectedRouteNo(rNo);
    setHomeStopNo(sNo);
    setIsEditingProfile(false);
  }

  function handleDriverLoginSubmit(e) {
    e.preventDefault();
    setAuthError("");

    const cleanDriverName =
      driverNameInput.trim() || `Bus #${driverRouteNo} Driver`;
    const cleanPhone = driverPhoneInput.trim();

    fetch("/api/auth/driver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routeNo: Number(driverRouteNo),
        password: driverPasswordInput,
        driverName: cleanDriverName,
        driverPhone: cleanPhone
      })
    })
      .then((r) => r.json())
      .then((res) => {
        if (!res.ok) {
          setAuthError(res.message || "Invalid Driver credentials");
          return;
        }
        saveToOrbitAutofill("driverNames", cleanDriverName);
        if (cleanPhone) saveToOrbitAutofill("driverPhones", cleanPhone);

        localStorage.setItem("orbitlive_user_v4", JSON.stringify(res.profile));
        setSavedUser(res.profile);
        setSelectedRouteNo(res.profile.routeNo);
        setHomeStopNo(1);
        setIsEditingProfile(false);
      })
      .catch(() => setAuthError("Could not connect to authentication server."));
  }

  function handleAdminLoginSubmit(e) {
    e.preventDefault();
    setAuthError("");

    fetch("/api/auth/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminId: selectedAdminId,
        password: adminPasswordInput
      })
    })
      .then((r) => r.json())
      .then((res) => {
        if (!res.ok) {
          setAuthError(res.message || "Invalid Admin password");
          return;
        }
        localStorage.setItem("orbitlive_user_v4", JSON.stringify(res.profile));
        setSavedUser(res.profile);
        setAdminViewMapMode(false);
        setIsEditingProfile(false);
      })
      .catch(() => setAuthError("Could not verify Admin credentials."));
  }

  function handleLogout() {
    stopLiveLocationSharing(true);
    localStorage.removeItem("orbitlive_user_v4");
    setSavedUser(null);
    setDriverPasswordInput("");
    setAdminPasswordInput("");
    setAuthError("");
    setAdminViewMapMode(false);
    setIsEditingProfile(true);
  }

  const formChosenStopObj = useMemo(
    () =>
      formSelectedRoute?.stops.find((s) => s.stopNo === Number(formStopNo)) ||
      null,
    [formSelectedRoute, formStopNo]
  );

  // ==========================================================================
  // VIEW 1: 3-ROLE GLASS LOGIN PORTAL
  // ==========================================================================
  if (!savedUser || isEditingProfile) {
    const roleCards = [
      {
        key: "STUDENT",
        title: "Student",
        subtitle: "Commuter Live Map",
        icon: GraduationCap
      },
      {
        key: "DRIVER",
        title: "Driver",
        subtitle: "Bus Pilot Broadcast",
        icon: Truck
      },
      {
        key: "ADMIN",
        title: "Admin",
        subtitle: "Fleet Command",
        icon: Shield
      }
    ];

    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 bg-slate-100 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 relative overflow-hidden">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-sky-500/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px]" />
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

        <div className="relative z-10 w-full max-w-md rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/85 border border-slate-200/90 dark:border-white/10 shadow-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <OrbitLogo size={42} />
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  OrbitLive
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  SRM Trichy Live Bus Transit Portal
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

          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {roleCards.map((card) => {
              const IconComp = card.icon;
              const active = loginRoleTab === card.key;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => {
                    setLoginRoleTab(card.key);
                    setAuthError("");
                  }}
                  className={`p-3 rounded-2xl backdrop-blur-xl border text-left transition flex flex-col justify-between h-24 ${
                    active
                      ? "bg-sky-500/15 border-sky-500/50 text-sky-500 dark:text-sky-300 shadow-lg shadow-sky-500/10"
                      : "bg-white/60 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <IconComp
                      className={`w-5 h-5 ${
                        active ? "text-sky-400" : "text-slate-400"
                      }`}
                    />
                    {active && (
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {card.title}
                    </div>
                    <div className="text-[10px] opacity-75 truncate">
                      {card.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {authError && (
            <div className="mb-4 px-3.5 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* TAB 1: STUDENT LOGIN FORM */}
          {loginRoleTab === "STUDENT" && (
            <form
              onSubmit={handleStudentLoginSubmit}
              autoComplete="off"
              className="space-y-4"
            >
              <input type="text" name="trap_user" style={{ display: "none" }} tabIndex={-1} />
              <input type="password" name="trap_pass" style={{ display: "none" }} tabIndex={-1} />

              <OrbitInput
                label="Student Name"
                required
                value={formName}
                onChange={setFormName}
                placeholder="Enter your full name"
                historyCategory="studentNames"
              />

              <GlassDropdown
                label="Bus Number & Route"
                value={formRouteNo}
                options={busDropdownOptions}
                onChange={(val) => {
                  const nextRNo = Number(val);
                  setFormRouteNo(nextRNo);
                  setFormStopNo(stopByRoute[nextRNo] || 1);
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

              {formChosenStopObj && (
                <div className="p-3.5 rounded-2xl backdrop-blur-xl bg-sky-500/10 border border-sky-500/25 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-sky-500 dark:text-sky-400">
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
                  Enter as Student
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: DRIVER LOGIN FORM */}
          {loginRoleTab === "DRIVER" && (
            <form
              onSubmit={handleDriverLoginSubmit}
              autoComplete="off"
              className="space-y-4"
            >
              <input type="text" name="trap_d_user" style={{ display: "none" }} tabIndex={-1} />
              <input type="password" name="trap_d_pass" style={{ display: "none" }} tabIndex={-1} />

              <GlassDropdown
                label="Assigned Bus Number"
                value={driverRouteNo}
                options={busDropdownOptions}
                onChange={(val) => setDriverRouteNo(Number(val))}
                placeholder="Select your Bus Number"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <OrbitInput
                  label="Driver Name"
                  required
                  value={driverNameInput}
                  onChange={setDriverNameInput}
                  placeholder="Enter Driver Name"
                  historyCategory="driverNames"
                />

                <OrbitPasswordInput
                  label={`Bus Password (BUS${driverRouteNo})`}
                  value={driverPasswordInput}
                  onChange={setDriverPasswordInput}
                  placeholder={`BUS${driverRouteNo}`}
                />
              </div>

              <OrbitInput
                label="Driver Phone Number (Optional — Shown to Students)"
                inputMode="tel"
                value={driverPhoneInput}
                onChange={setDriverPhoneInput}
                placeholder="e.g. 9876543210"
                historyCategory="driverPhones"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-900 dark:bg-sky-500 hover:opacity-95 text-white dark:text-slate-950 shadow-md transition"
              >
                Login as Bus #{String(driverRouteNo).padStart(2, "0")} Driver
              </button>
            </form>
          )}

          {/* TAB 3: ADMIN LOGIN FORM */}
          {loginRoleTab === "ADMIN" && (
            <form
              onSubmit={handleAdminLoginSubmit}
              autoComplete="off"
              className="space-y-4"
            >
              <input type="text" name="trap_a_user" style={{ display: "none" }} tabIndex={-1} />
              <input type="password" name="trap_a_pass" style={{ display: "none" }} tabIndex={-1} />

              <GlassDropdown
                label="Select Administrator"
                value={selectedAdminId}
                options={adminDropdownOptions}
                onChange={(val) => setSelectedAdminId(val)}
                searchable={false}
              />

              <OrbitPasswordInput
                label="Admin Security Password"
                value={adminPasswordInput}
                onChange={setAdminPasswordInput}
                placeholder="Enter Admin Password"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-900 dark:bg-sky-500 hover:opacity-95 text-white dark:text-slate-950 shadow-md transition"
              >
                Enter Admin Command Center
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW 2: ADMIN COMMAND CENTER
  // ==========================================================================
  if (savedUser.role === "ADMIN" && !adminViewMapMode) {
    return (
      <AdminDashboard
        adminUser={savedUser}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
        onOpenLiveMap={() => setAdminViewMapMode(true)}
      />
    );
  }

  // ==========================================================================
  // VIEW 3: MAIN LIVE RADAR UI
  // ==========================================================================
  const busStarted = Boolean(telemetry && telemetry.started);
  const currentSpeedKmh = busStarted ? Math.max(0, telemetry.speedKmh || 0) : 0;
  const speedPct = Math.min(100, Math.round((currentSpeedKmh / 80) * 100));

  const activeDriverPhone =
    telemetry?.driverPhone || currentRoute?.driverPhone || "";
  const activeDriverName =
    telemetry?.driverName || currentRoute?.driverName || "Driver";

  const canSeeCallDriver =
    Boolean(activeDriverPhone) &&
    savedUser.role !== "DRIVER" &&
    (savedUser.role === "ADMIN" ||
      (savedUser.role === "STUDENT" &&
        Number(selectedRouteNo) === Number(savedUser.routeNo)));

  const myHomeStopObj =
    currentRoute?.stops.find((s) => s.stopNo === Number(homeStopNo)) ||
    currentRoute?.stops?.[0];

  const myHomeStopEtaObj = telemetry?.stopEtas?.find(
    (e) => e.stopNo === Number(homeStopNo)
  );

  const routeLastStopEvening = currentRoute?.stops?.[0];

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

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-100 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 overflow-hidden select-none">
      <header className="relative z-30 px-3 pt-2.5 pb-2 backdrop-blur-2xl bg-white/85 dark:bg-[#0b101b]/85 border-b border-slate-200/80 dark:border-white/10">
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex items-center justify-between gap-2">
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

            <div className="flex items-center gap-1.5 shrink-0">
              {savedUser.role === "ADMIN" ? (
                <button
                  onClick={() => setAdminViewMapMode(false)}
                  className="px-2.5 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs"
                >
                  Admin Panel
                </button>
              ) : (
                <button
                  onClick={() => {
                    setLoginRoleTab(savedUser.role || "STUDENT");
                    setFormName(savedUser.name);
                    setFormRouteNo(selectedRouteNo);
                    setFormStopNo(homeStopNo);
                    setIsEditingProfile(true);
                  }}
                  title="Edit Profile"
                  className="px-2.5 py-2 rounded-xl backdrop-blur-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-white/10 text-xs font-medium flex items-center gap-1 max-w-[105px]"
                >
                  {savedUser.role === "DRIVER" ? (
                    <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  )}
                  <span className="truncate">{savedUser.name.split(" ")[0]}</span>
                </button>
              )}

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

          {announcement?.text && (
            <div className="px-3 py-2 rounded-2xl text-[11px] font-semibold bg-indigo-500/15 border border-indigo-500/35 text-indigo-600 dark:text-indigo-300 flex items-center gap-2">
              <Megaphone className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Admin Notice ({announcement.byAdmin}):</strong>{" "}
                {announcement.text}
              </span>
            </div>
          )}

          {proximityAlertBanner && (
            <div
              className={`px-3 py-2 rounded-2xl text-[11px] font-semibold flex items-center gap-2 border shadow-sm ${
                proximityAlertBanner.type === "DELAY"
                  ? "bg-amber-500/15 border-amber-500/35 text-amber-600 dark:text-amber-300"
                  : "bg-emerald-500/15 border-emerald-500/35 text-emerald-600 dark:text-emerald-300"
              }`}
            >
              <Bell className="w-3.5 h-3.5 shrink-0 animate-bounce" />
              <span className="leading-snug">{proximityAlertBanner.message}</span>
            </div>
          )}
        </div>
      </header>

      <div className="relative flex-1 w-full overflow-hidden">
        <LiveMap
          route={currentRoute}
          telemetry={telemetry}
          myCoords={myCoords}
          gpsStatus={gpsStatus}
          focusedStop={focusedStop}
          homeStopNo={homeStopNo}
          darkMode={darkMode}
          onRequestFreshGps={requestFreshHardwareGps}
        />
      </div>

      <section className="relative z-30 backdrop-blur-2xl bg-white/90 dark:bg-[#0b101b]/95 border-t border-slate-200/90 dark:border-white/10 rounded-t-3xl shadow-2xl transition-all duration-300">
        <div className="max-w-lg mx-auto px-3.5 pt-2.5 pb-3.5">
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
                  {busStarted && telemetry.delayStatus === "DELAYED" && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                      Delayed +{telemetry.delayMinutes}m
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {busStarted
                    ? `Your Stop (${myHomeStopObj?.name}): ${
                        myHomeStopEtaObj?.passed
                          ? "Bus Already Crossed"
                          : `ETA ~${myHomeStopEtaObj?.etaMinutes ?? 1} min`
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

          {canSeeCallDriver && (
            <div className="mb-2 px-3 py-2 rounded-2xl backdrop-blur-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold truncate">
                  Driver ({activeDriverName}):{" "}
                  <strong className="font-mono text-emerald-400">
                    {activeDriverPhone}
                  </strong>
                </span>
              </div>
              <a
                href={`tel:${activeDriverPhone}`}
                className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-bold text-[11px] shrink-0"
              >
                Call Driver
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-1.5">
            <div className="p-2.5 rounded-2xl backdrop-blur-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>Speedometer</span>
                <Gauge className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                  {currentSpeedKmh}
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
                : savedUser.role === "DRIVER"
                ? `Start Driver Broadcast for Bus #${String(
                    selectedRouteNo
                  ).padStart(2, "0")}`
                : `Share Live Location for Bus #${String(
                    selectedRouteNo
                  ).padStart(2, "0")}`}
            </button>
          </div>

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