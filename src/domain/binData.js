const FORBIDDEN_FIREBASE_KEY_CHARACTERS = /[.#$\[\]\/\u0000-\u001f\u007f]/;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isValidFirebaseKey(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !FORBIDDEN_FIREBASE_KEY_CHARACTERS.test(value)
  );
}

export function parseBinMetadata(pathBinId, rawMetadata) {
  if (!isRecord(rawMetadata)) {
    return { metadata: null, errors: ["Bin metadata is missing or invalid."] };
  }

  const errors = [];
  const binId =
    typeof rawMetadata.binId === "string" ? rawMetadata.binId.trim() : "";
  const grainType =
    typeof rawMetadata.grainType === "string"
      ? rawMetadata.grainType.trim()
      : "";
  const deviceId =
    typeof rawMetadata.deviceId === "string"
      ? rawMetadata.deviceId.trim()
      : "";

  if (!binId || binId !== pathBinId) {
    errors.push("The metadata binId does not match its database path.");
  }
  if (!grainType) errors.push("The grainType is missing.");
  if (!deviceId) errors.push("The deviceId is missing.");

  if (errors.length > 0) return { metadata: null, errors };

  return {
    metadata: { binId, grainType, deviceId },
    errors,
  };
}

export function parseTimestamp(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = value < 1_000_000_000_000 ? value * 1000 : value;
    return Number.isFinite(new Date(milliseconds).getTime())
      ? milliseconds
      : null;
  }

  if (typeof value === "string" && value.trim()) {
    const milliseconds = Date.parse(value);
    return Number.isFinite(milliseconds) ? milliseconds : null;
  }

  return null;
}

function parseOptionalNumber(source, field, errors) {
  if (source[field] === undefined || source[field] === null) return null;
  if (typeof source[field] === "number" && Number.isFinite(source[field])) {
    return source[field];
  }

  errors.push(`${field} must be a finite number.`);
  return null;
}

function parseSensorErrors(source) {
  const errors = source.sensorErrors ?? source.sensorError;
  if (typeof errors === "string" && errors.trim()) return [errors.trim()];
  if (Array.isArray(errors)) {
    return errors.filter((error) => typeof error === "string" && error.trim());
  }
  return [];
}

export function parseSensorReading(rawReading) {
  if (!isRecord(rawReading)) {
    return {
      reading: null,
      errors: ["Sensor reading is missing or is not an object."],
      sensorErrors: [],
    };
  }

  const errors = [];
  const temperatureC = parseOptionalNumber(rawReading, "temperatureC", errors);
  const humidityPercent = parseOptionalNumber(
    rawReading,
    "humidityPercent",
    errors,
  );
  const riskScore = parseOptionalNumber(rawReading, "riskScore", errors);

  if (
    humidityPercent !== null &&
    (humidityPercent < 0 || humidityPercent > 100)
  ) {
    errors.push("humidityPercent must be between 0 and 100.");
  }

  const gasRawAdc = parseOptionalNumber(rawReading, "gasRawAdc", errors);
  const calibratedGasValue =
    rawReading.gasValue === undefined || rawReading.gasValue === null
      ? null
      : parseOptionalNumber(rawReading, "gasValue", errors);
  const gasUnit =
    typeof rawReading.gasUnit === "string" && rawReading.gasUnit.trim()
      ? rawReading.gasUnit.trim()
      : null;
  let gas = null;

  if (gasRawAdc !== null) {
    gas = { value: gasRawAdc, unit: "raw ADC" };
  } else if (calibratedGasValue !== null && gasUnit) {
    gas = { value: calibratedGasValue, unit: gasUnit };
  } else if (calibratedGasValue !== null) {
    errors.push("gasUnit is required when gasValue is provided.");
  }

  const timestamp = parseTimestamp(rawReading.timestamp);
  if (rawReading.timestamp !== undefined && timestamp === null) {
    errors.push("timestamp is not a supported date or timestamp.");
  }

  for (const field of ["riskLabel", "modelVersion"]) {
    if (
      rawReading[field] !== undefined &&
      rawReading[field] !== null &&
      typeof rawReading[field] !== "string"
    ) {
      errors.push(`${field} must be a string.`);
    }
  }

  const statusValue =
    rawReading.deviceStatus ??
    rawReading.connectivityStatus ??
    rawReading.deviceConnectivityStatus;
  if (statusValue !== undefined && statusValue !== null && typeof statusValue !== "string") {
    errors.push("Device connectivity status must be a string.");
  }
  const deviceStatus =
    typeof statusValue === "string" ? statusValue.trim().toLowerCase() : null;

  return {
    reading: {
      temperatureC,
      humidityPercent,
      gas,
      timestamp,
      riskLabel:
        typeof rawReading.riskLabel === "string"
          ? rawReading.riskLabel.trim()
          : null,
      riskScore,
      modelVersion:
        typeof rawReading.modelVersion === "string"
          ? rawReading.modelVersion.trim()
          : null,
      deviceStatus,
      sensorErrors: parseSensorErrors(rawReading),
      hasMeasurements:
        temperatureC !== null ||
        humidityPercent !== null ||
        gasRawAdc !== null ||
        calibratedGasValue !== null,
      hasAnyData:
        temperatureC !== null ||
        humidityPercent !== null ||
        gasRawAdc !== null ||
        calibratedGasValue !== null ||
        (typeof rawReading.riskLabel === "string" &&
          rawReading.riskLabel.trim().length > 0) ||
        riskScore !== null ||
        (typeof rawReading.modelVersion === "string" &&
          rawReading.modelVersion.trim().length > 0),
    },
    errors,
    sensorErrors: parseSensorErrors(rawReading),
  };
}

export function getDeviceStatus(reading) {
  if (reading?.deviceStatus === "online") return "online";
  if (reading?.deviceStatus === "offline") return "offline";
  return "unknown";
}

export function parseHistory(rawHistory) {
  if (!isRecord(rawHistory)) {
    return { readings: [], errors: [] };
  }

  const readings = [];
  const errors = [];

  for (const [key, rawReading] of Object.entries(rawHistory)) {
    const parsed = parseSensorReading(rawReading);
    if (!parsed.reading || parsed.errors.length > 0) {
      errors.push(`History entry ${key} contains invalid fields.`);
      continue;
    }
    if (parsed.reading.timestamp === null) {
      errors.push(`History entry ${key} has no valid timestamp.`);
      continue;
    }
    if (parsed.sensorErrors.length > 0) {
      errors.push(`History entry ${key} reports a sensor error.`);
    }

    readings.push({
      ...parsed.reading,
      time: new Date(parsed.reading.timestamp).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  }

  readings.sort((first, second) => first.timestamp - second.timestamp);
  return { readings, errors };
}
