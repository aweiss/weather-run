export interface HourData {
  datetime: string;
  temp: number;
  feelslike: number;
  humidity: number;
  precip: number;
  precipprob: number;
  windspeed: number;
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
  conditions: string;
  sunrise: string;
  sunset: string;
  hours: HourData[];
}

export interface WeatherResponse {
  resolvedAddress: string;
  address: string;
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
  conditions: string;
  sunrise: string;
  sunset: string;
  gear: string;
  score: number;
  isTopPick: boolean;
}
