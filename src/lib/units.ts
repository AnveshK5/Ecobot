export type UnitPreference = "metric" | "imperial";

const KG_TO_LB = 2.20462;
const MILE_TO_KM = 1.60934;

export function carbonUnit(units: UnitPreference) {
  return units === "imperial" ? "lb" : "kg";
}

export function distanceUnit(units: UnitPreference) {
  return units === "imperial" ? "mi" : "km";
}

export function convertCarbon(valueKg: number, units: UnitPreference) {
  return units === "imperial" ? valueKg * KG_TO_LB : valueKg;
}

export function convertDistance(valueMiles: number, units: UnitPreference) {
  return units === "imperial" ? valueMiles : valueMiles * MILE_TO_KM;
}

export function formatCarbon(valueKg: number, units: UnitPreference, digits = 1) {
  return `${convertCarbon(valueKg, units).toFixed(digits)} ${carbonUnit(units)}`;
}

export function formatDistance(valueMiles: number, units: UnitPreference, digits = 1) {
  return `${convertDistance(valueMiles, units).toFixed(digits)} ${distanceUnit(units)}`;
}
