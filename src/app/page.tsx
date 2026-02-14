"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Wind,
  Droplets,
  CloudRain,
  Sunrise,
  Sunset,
  Share2,
  ChevronUp,
  ChevronDown,
  Shirt,
  Loader2,
  Sun,
  Cloud,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Compass,
  ShieldAlert,
  AlertTriangle,
  X,
  type LucideIcon,
} from "lucide-react";
import { fetchWeather, processWeatherData } from "@/lib/weather";
import { RunDay, WeatherAlert } from "@/lib/types";

const STORAGE_KEY_ZIP = "weatherrun_zip";
const STORAGE_KEY_HOUR = "weatherrun_hour";
const STORAGE_KEY_MINUTE = "weatherrun_minute";
const DEFAULT_HOUR = 5; // 5:30 AM -> hour 5
const DEFAULT_MINUTE = 30;

function formatRunTime(hour: number, minute: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${String(minute).padStart(2, "0")} ${ampm}`;
}

function getWeatherIcon(conditions: string): LucideIcon {
  const c = conditions.toLowerCase();
  if (c.includes("thunder") || c.includes("lightning")) return CloudLightning;
  if (c.includes("snow") || c.includes("ice") || c.includes("sleet") || c.includes("freez")) return CloudSnow;
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return CloudRain;
  if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return CloudFog;
  if (c.includes("overcast")) return Cloud;
  if (c.includes("cloud") || c.includes("partly")) return Cloud;
  if (c.includes("wind") || c.includes("gust")) return Wind;
  return Sun;
}

function uvLabel(uv: number): string {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Mod";
  if (uv <= 7) return "High";
  if (uv <= 10) return "V.High";
  return "Ext";
}

function aqiLabel(risk: number): string {
  if (risk <= 10) return "Good";
  if (risk <= 30) return "Mod";
  if (risk <= 60) return "Poor";
  return "Hazard";
}

export default function Home() {
  const [location, setLocation] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [runHour, setRunHour] = useState(DEFAULT_HOUR);
  const [runMinute, setRunMinute] = useState(DEFAULT_MINUTE);
  const [days, setDays] = useState<RunDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resolvedCity, setResolvedCity] = useState("");
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedZip = localStorage.getItem(STORAGE_KEY_ZIP);
    const savedHour = localStorage.getItem(STORAGE_KEY_HOUR);
    const savedMinute = localStorage.getItem(STORAGE_KEY_MINUTE);
    if (savedZip) {
      setLocation(savedZip);
      setInputValue(savedZip);
    }
    if (savedHour) {
      setRunHour(parseInt(savedHour, 10));
    }
    if (savedMinute) {
      setRunMinute(parseInt(savedMinute, 10));
    }
    setHydrated(true);
  }, []);

  const loadWeather = useCallback(
    async (loc: string, hour: number, minute: number) => {
      if (!loc.trim()) return;
      setLoading(true);
      setError("");
      try {
        // Round to nearest hour for the API (Visual Crossing uses hourly data)
        const apiHour = minute >= 30 ? (hour + 1) % 24 : hour;
        const data = await fetchWeather(loc.trim());
        const processed = processWeatherData(data, apiHour);
        setDays(processed);
        setResolvedCity(data.resolvedAddress);
        setAlerts(data.alerts ?? []);
        setAlertsDismissed(false);
        // Persist
        localStorage.setItem(STORAGE_KEY_ZIP, loc.trim());
        localStorage.setItem(STORAGE_KEY_HOUR, String(hour));
        localStorage.setItem(STORAGE_KEY_MINUTE, String(minute));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load weather data.");
        setDays([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Auto-load on hydration if we have a saved location
  useEffect(() => {
    if (hydrated && location) {
      loadWeather(location, runHour, runMinute);
    }
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setLocation(inputValue.trim());
      loadWeather(inputValue.trim(), runHour, runMinute);
    }
  };

  const adjustTime = (delta: number) => {
    // delta is +30 or -30 minutes
    let totalMinutes = runHour * 60 + runMinute + delta;
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    totalMinutes = totalMinutes % (24 * 60);
    const nextHour = Math.floor(totalMinutes / 60);
    const nextMinute = totalMinutes % 60;
    setRunHour(nextHour);
    setRunMinute(nextMinute);
    if (location) {
      loadWeather(location, nextHour, nextMinute);
    }
  };

  const handleShare = async (day: RunDay) => {
    const text = [
      `Weather2Run Report for ${resolvedCity}`,
      `${day.dayLabel} at ${formatRunTime(runHour, runMinute)}`,
      `Temp: ${day.temp}F / Feels Like: ${day.feelslike}F`,
      `Wind: ${day.windspeed} mph ${day.winddir} / Humidity: ${day.humidity}%`,
      `Precip: ${day.precipprob}% / UV: ${day.uvindex} / AQI: ${aqiLabel(day.severerisk)}`,
      `${day.conditions}`,
      `Sunrise: ${day.sunrise} / Sunset: ${day.sunset}`,
      `Gear: ${day.gear}`,
    ].join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "Weather2Run Report", text });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert("Report copied to clipboard!");
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      {/* Weather Alerts */}
      {!alertsDismissed && alerts.length > 0 && (
        <div className="bg-red-600 text-white px-4 py-3 relative">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              {alerts.map((alert, i) => (
                <p key={i} className="text-xs font-semibold leading-snug">
                  {alert.event}{alert.headline ? ` — ${alert.headline}` : ""}
                </p>
              ))}
            </div>
            <button
              onClick={() => setAlertsDismissed(true)}
              className="p-0.5 hover:bg-white/20 rounded transition-colors shrink-0"
              aria-label="Dismiss alerts"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-dark/95 backdrop-blur-sm border-b border-white/10 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold tracking-tight">
            WEATHER<span className="text-lime">2</span>RUN
          </h1>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Zip code or city"
            className="w-full bg-card rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-lime/50"
          />
        </form>

        {/* Time Stepper */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs text-muted uppercase tracking-wider">Run Time</span>
          <div className="flex items-center gap-1 bg-card rounded-lg px-2 py-1">
            <button
              onClick={() => adjustTime(-30)}
              className="p-1 text-muted hover:text-white transition-colors"
              aria-label="Earlier"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="text-sm font-mono w-20 text-center font-medium">
              {formatRunTime(runHour, runMinute)}
            </span>
            <button
              onClick={() => adjustTime(30)}
              className="p-1 text-muted hover:text-white transition-colors"
              aria-label="Later"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-3">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-lime" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && days.length === 0 && hydrated && (
          <div className="text-center py-20 text-muted">
            <p className="text-sm">Enter a location to find your best run day.</p>
          </div>
        )}

        {/* City Header */}
        {!loading && days.length > 0 && (
          <div className="pb-1">
            <p className="text-xs text-muted uppercase tracking-wider">{resolvedCity}</p>
          </div>
        )}

        {/* Weather Cards */}
        {!loading &&
          days.map((day) => (
            <div
              key={day.date}
              className={`relative rounded-xl p-4 transition-colors ${
                day.isTopPick
                  ? "bg-card border-4 border-[#CCFF00] shadow-[0_0_20px_#CCFF00]"
                  : "bg-card border border-white/5 hover:border-white/10"
              }`}
            >
              {/* Top Pick Badge */}
              {day.isTopPick && (
                <div className="flex justify-center mb-3">
                  <span className="bg-lime text-black text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full ring-4 ring-lime/20">
                    Top Pick
                  </span>
                </div>
              )}

              {/* Day Header + Weather Icon */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">{day.dayLabel}</h2>
                {(() => {
                  const WeatherIcon = getWeatherIcon(day.conditions);
                  return (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted">{day.conditions}</span>
                      <WeatherIcon className="w-5 h-5 text-white/70" />
                    </div>
                  );
                })()}
              </div>

              {/* Temp Row — inline feels like */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold tabular-nums">{day.temp}°</span>
                <span className="text-lg text-muted/60 font-light">|</span>
                <span className="text-sm text-muted">Feels {day.feelslike}°</span>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted">
                  <Wind className="w-3.5 h-3.5 shrink-0" />
                  <span>{day.windspeed} mph</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Compass className="w-3.5 h-3.5 shrink-0" />
                  <span>{day.winddir}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Droplets className="w-3.5 h-3.5 shrink-0" />
                  <span>{day.humidity}%</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <CloudRain className="w-3.5 h-3.5 shrink-0" />
                  <span>{day.precipprob}% rain</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Sun className="w-3.5 h-3.5 shrink-0" />
                  <span>UV {day.uvindex} {uvLabel(day.uvindex)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>AQI {aqiLabel(day.severerisk)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Sunrise className="w-3.5 h-3.5 shrink-0" />
                  <span>{day.sunrise}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Sunset className="w-3.5 h-3.5 shrink-0" />
                  <span>{day.sunset}</span>
                </div>
              </div>

              {/* Gear */}
              <div className="flex items-start gap-3 bg-white/5 rounded-lg px-4 py-3 mb-3">
                <Shirt className="w-4 h-4 text-lime mt-0.5 shrink-0" />
                <p className="text-sm text-white/80 leading-relaxed">{day.gear}</p>
              </div>

              {/* Share Button */}
              <button
                onClick={() => handleShare(day)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share with Runner
              </button>
            </div>
          ))}
      </main>

      {/* Footer */}
      <footer className="px-4 py-4 text-center">
        <p className="text-[10px] text-muted/50">
          Weather2Run &middot; Powered by Visual Crossing
        </p>
      </footer>
    </div>
  );
}
