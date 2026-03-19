export interface HourData {
  datetime: string;
  temp: number;
  feelslike: number;
  humidity: number;
  precip: number;
  precipprob: number;
  windspeed: number;
  winddir: number;
  uvindex: number;
  severerisk?: number;
  conditions: string;
}

export interface DayData {
  datetime: string;
  tempmax: number;
  tempmin: number;
  temp: number;
  feelslike: number;
  humidity: number;
  precip: number;
  precipprob: number;
  windspeed: number;
  winddir: number;
  uvindex: number;
  severerisk?: number;
  conditions: string;
  sunrise: string;
  sunset: string;
  hours: HourData[];
}

export interface WeatherAlert {
  event: string;
  headline: string;
  description: string;
  ends: string;
  onset: string;
}

export interface WeatherResponse {
  resolvedAddress: string;
  address: string;
  alerts?: WeatherAlert[];
  days: DayData[];
}

export interface RunDay {
  date: string;
  dayLabel: string;
  temp: number;
  feelslike: number;
  humidity: number;
  precipprob: number;
  windspeed: number;
  winddir: string;
  uvindex: number;
  severerisk: number;
  conditions: string;
  sunrise: string;
  sunset: string;
  gear: string;
  score: number;
  isTopPick: boolean;
}
