const grainTypeNames = [
  "Rice",
  "Wheat",
  "Maize",
  "Ragi",
  "Jowar",
  "Bajra",
];

export const grainProfiles = Object.freeze(
  Object.fromEntries(
    grainTypeNames.map((name) => [
      name.toLowerCase(),
      Object.freeze({
        name,
        thresholds: null,
        source: null,
      }),
    ]),
  ),
);

export const supportedGrainTypes = Object.freeze(grainTypeNames);

export function getGrainProfile(grainType) {
  const key = typeof grainType === "string" ? grainType.trim().toLowerCase() : "";
  const configured = grainProfiles[key];

  return (
    configured ?? {
      name: typeof grainType === "string" ? grainType.trim() : "",
      thresholds: null,
      source: null,
    }
  );
}

export function assessStorageCondition(profile, reading) {
  const thresholds = profile?.thresholds;
  const source = profile?.source;
  const temperatureMinimum = thresholds?.temperatureC?.minimum;
  const temperatureMaximum = thresholds?.temperatureC?.maximum;
  const humidityMinimum = thresholds?.humidityPercent?.minimum;
  const humidityMaximum = thresholds?.humidityPercent?.maximum;

  if (
    typeof source !== "string" ||
    !source.trim() ||
    !Number.isFinite(temperatureMinimum) ||
    !Number.isFinite(temperatureMaximum) ||
    temperatureMinimum > temperatureMaximum ||
    !Number.isFinite(humidityMinimum) ||
    !Number.isFinite(humidityMaximum) ||
    humidityMinimum < 0 ||
    humidityMaximum > 100 ||
    humidityMinimum > humidityMaximum
  ) {
    return "not-assessed";
  }

  if (
    !Number.isFinite(reading?.temperatureC) ||
    !Number.isFinite(reading?.humidityPercent)
  ) {
    return "insufficient-data";
  }

  if (
    reading.temperatureC < temperatureMinimum ||
    reading.temperatureC > temperatureMaximum ||
    reading.humidityPercent < humidityMinimum ||
    reading.humidityPercent > humidityMaximum
  ) {
    return "attention";
  }

  return "within-profile";
}
