import { DayData, WeatherResponse, RunDay } from "./types";
import { getGearSuggestion } from "./gear";

const API_BASE = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline";

export async function fetchWeather(location: string): Promise<WeatherResponse> {
  const key = process.env.NEXT_PUBLIC_VISUAL_CROSSING_KEY;
  if (!key) {
    throw new Error("Visual Crossing API key is not configured.");
  }

  const encoded = encodeURIComponent(location);
  const url = `${API_BASE}/${encoded}/next7days?unitGroup=us&include=days,hours&key=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 400) {
      throw new Error("Location not found. Try a zip code or city name.");
    }
    throw new Error(`Weather API error: ${res.status}`);
  }

  return res.json();
}

function getHourData(day: DayData, hour: number): { temp: number; feelslike: number; humidity: number; windspeed: number; precipprob: number; conditions: string } | null {
  const padded = `${String(hour).padStart(2, "0")}:00:00`;
  const match = day.hours?.find((h) => h.datetime === padded);
  if (match) {
    return {
      temp: match.temp,
      feelslike: match.feelslike,
      humidity: match.humidity,
      windspeed: match.windspeed,
      precipprob: match.precipprob,
      conditions: match.conditions,
    };
  }
  return null;
}

function getDayLabel(dateStr: string, index: number): string {
  const date = new Date(dateStr + "T12:00:00");
  if (index === 0) {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  }
  if (index === 1) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  }
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

export function processWeatherData(data: WeatherResponse, runHour: number): RunDay[] {
  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = now.toISOString().split("T")[0];

  // Future-only logic: if the run hour has passed today, skip today
  const startIndex = data.days.findIndex((d) => {
    if (d.datetime === todayStr) {
      return runHour > currentHour;
    }
    return d.datetime > todayStr;
  });

  if (startIndex === -1) return [];

  const days = data.days.slice(startIndex, startIndex + 5);

  const runDays: RunDay[] = days.map((day, i) => {
    const hourData = getHourData(day, runHour);
    const temp = hourData?.temp ?? day.temp;
    const feelslike = hourData?.feelslike ?? day.feelslike;
    const humidity = hourData?.humidity ?? day.humidity;
    const windspeed = hourData?.windspeed ?? day.windspeed;
    const precipprob = hourData?.precipprob ?? day.precipprob;
    const conditions = hourData?.conditions ?? day.conditions;

    // Score: distance from 55°F (feelslike) + precipitation penalty
    const tempDiff = Math.abs(feelslike - 55);
    const score = tempDiff + precipprob * 0.5;

    return {
      date: day.datetime,
      dayLabel: getDayLabel(day.datetime, i),
      temp: Math.round(temp),
      feelslike: Math.round(feelslike),
      humidity: Math.round(humidity),
      precipprob: Math.round(precipprob),
      windspeed: Math.round(windspeed),
      conditions,
      sunrise: formatTime12(day.sunrise),
      sunset: formatTime12(day.sunset),
      gear: getGearSuggestion(feelslike),
      score,
      isTopPick: false,
    };
  });

  // Mark the best day as top pick
  if (runDays.length > 0) {
    let bestIndex = 0;
    let bestScore = runDays[0].score;
    for (let i = 1; i < runDays.length; i++) {
      if (runDays[i].score < bestScore) {
        bestScore = runDays[i].score;
        bestIndex = i;
      }
    }
    runDays[bestIndex].isTopPick = true;
  }

  return runDays;
}
