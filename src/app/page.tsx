"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Thermometer,
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
} from "lucide-react";
import { fetchWeather, processWeatherData } from "@/lib/weather";
import { RunDay } from "@/lib/types";

const STORAGE_KEY_ZIP = "weatherrun_zip";
const STORAGE_KEY_HOUR = "weatherrun_hour";
const DEFAULT_HOUR = 5; // 5:30 AM -> hour 5
const DEFAULT_MINUTE = 30;

function formatRunTime(hour: number, minute: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${String(minute).padStart(2, "0")} ${ampm}`;
}

export default function Home() {
  const [location, setLocation] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [runHour, setRunHour] = useState(DEFAULT_HOUR);
  const [runMinute] = useState(DEFAULT_MINUTE);
  const [days, setDays] = useState<RunDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resolvedCity, setResolvedCity] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedZip = localStorage.getItem(STORAGE_KEY_ZIP);
    const savedHour = localStorage.getItem(STORAGE_KEY_HOUR);
    if (savedZip) {
      setLocation(savedZip);
      setInputValue(savedZip);
    }
    if (savedHour) {
      setRunHour(parseInt(savedHour, 10));
    }
    setHydrated(true);
  }, []);

  const loadWeather = useCallback(
    async (loc: string, hour: number) => {
      if (!loc.trim()) return;
      setLoading(true);
      setError("");
      try {
        const data = await fetchWeather(loc.trim());
        const processed = processWeatherData(data, hour);
        setDays(processed);
        setResolvedCity(data.resolvedAddress);
        // Persist
        localStorage.setItem(STORAGE_KEY_ZIP, loc.trim());
        localStorage.setItem(STORAGE_KEY_HOUR, String(hour));
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
      loadWeather(location, runHour);
    }
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setLocation(inputValue.trim());
      loadWeather(inputValue.trim(), runHour);
    }
  };

  const adjustHour = (delta: number) => {
    const next = (runHour + delta + 24) % 24;
    setRunHour(next);
    if (location) {
      loadWeather(location, next);
    }
  };

  const handleShare = async (day: RunDay) => {
    const text = [
      `WeatherRun Report for ${resolvedCity}`,
      `${day.dayLabel} at ${formatRunTime(runHour, runMinute)}`,
      `Temp: ${day.temp}F / Feels Like: ${day.feelslike}F`,
      `Wind: ${day.windspeed} mph / Humidity: ${day.humidity}%`,
      `Precip: ${day.precipprob}% / ${day.conditions}`,
      `Sunrise: ${day.sunrise} / Sunset: ${day.sunset}`,
      `Gear: ${day.gear}`,
    ].join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "WeatherRun Report", text });
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
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-dark/95 backdrop-blur-sm border-b border-white/10 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold tracking-tight">
            WEATHER<span className="text-lime">RUN</span>
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
              onClick={() => adjustHour(-1)}
              className="p-1 text-muted hover:text-white transition-colors"
              aria-label="Earlier"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="text-sm font-mono w-20 text-center font-medium">
              {formatRunTime(runHour, runMinute)}
            </span>
            <button
              onClick={() => adjustHour(1)}
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
                  ? "bg-card border border-lime/30"
                  : "bg-card border border-white/5 hover:border-white/10"
              }`}
            >
              {/* Top Pick Badge */}
              {day.isTopPick && (
                <div className="flex justify-center mb-3">
                  <span className="bg-lime text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Top Pick
                  </span>
                </div>
              )}

              {/* Day Header */}
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-base font-semibold">{day.dayLabel}</h2>
                <span className="text-xs text-muted">{day.conditions}</span>
              </div>

              {/* Temp Row */}
              <div className="flex items-end gap-1 mb-4">
                <span className="text-4xl font-bold tabular-nums">{day.temp}°</span>
                <span className="text-sm text-muted mb-1">
                  Feels {day.feelslike}°
                </span>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted">
                  <Wind className="w-3.5 h-3.5 shrink-0" />
                  <span>{day.windspeed} mph</span>
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
                  <Thermometer className="w-3.5 h-3.5 shrink-0" />
                  <span>Feels {day.feelslike}°</span>
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
              <div className="flex items-start gap-2 bg-white/5 rounded-lg px-3 py-2 mb-3">
                <Shirt className="w-3.5 h-3.5 text-lime mt-0.5 shrink-0" />
                <p className="text-xs text-white/80 leading-relaxed">{day.gear}</p>
              </div>

              {/* Share Button */}
              <button
                onClick={() => handleShare(day)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share Report
              </button>
            </div>
          ))}
      </main>

      {/* Footer */}
      <footer className="px-4 py-4 text-center">
        <p className="text-[10px] text-muted/50">
          WeatherRun &middot; Powered by Visual Crossing
        </p>
      </footer>
    </div>
  );
}
