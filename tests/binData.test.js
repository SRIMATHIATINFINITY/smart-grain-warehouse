import assert from "node:assert/strict";
import test from "node:test";
import {
  getDeviceStatus,
  isValidFirebaseKey,
  parseBinMetadata,
  parseHistory,
  parseSensorReading,
} from "../src/domain/binData.js";
import {
  assessStorageCondition,
  getGrainProfile,
  supportedGrainTypes,
} from "../src/domain/grainProfiles.js";

test("Firebase path keys reject reserved characters without rewriting IDs", () => {
  assert.equal(isValidFirebaseKey("warehouse-01"), true);
  assert.equal(isValidFirebaseKey("bin/01"), false);
  assert.equal(isValidFirebaseKey("bin#01"), false);
  assert.equal(isValidFirebaseKey("  "), false);
});

test("bin metadata must match its path and include a grain and device", () => {
  const parsed = parseBinMetadata("bin-01", {
    binId: "bin-01",
    grainType: "Rice",
    deviceId: "esp32-01",
  });
  assert.deepEqual(parsed.metadata, {
    binId: "bin-01",
    grainType: "Rice",
    deviceId: "esp32-01",
  });
  assert.deepEqual(parseBinMetadata("bin-01", { binId: "bin-02" }).metadata, null);
});

test("sensor parsing preserves zero and does not invent a gas unit", () => {
  const parsed = parseSensorReading({ temperatureC: 0, gasRawAdc: 0 });
  assert.equal(parsed.reading.temperatureC, 0);
  assert.deepEqual(parsed.reading.gas, { value: 0, unit: "raw ADC" });
  assert.equal(parsed.reading.humidityPercent, null);
  assert.deepEqual(parsed.errors, []);
});

test("calibrated gas requires its reported unit and invalid humidity is surfaced", () => {
  const parsed = parseSensorReading({ gasValue: 12, humidityPercent: 120 });
  assert.equal(parsed.reading.gas, null);
  assert.match(parsed.errors.join(" "), /gasUnit is required/);
  assert.match(parsed.errors.join(" "), /humidityPercent must be between/);
});

test("device connectivity remains unknown unless the device reports a state", () => {
  assert.equal(getDeviceStatus(null), "unknown");
  assert.equal(
    getDeviceStatus(parseSensorReading({ deviceStatus: "online" }).reading),
    "online",
  );
  assert.equal(
    getDeviceStatus(
      parseSensorReading({ connectivityStatus: "offline" }).reading,
    ),
    "offline",
  );
});

test("history entries without valid timestamps are not charted and are reported", () => {
  const result = parseHistory({
    item: { timestamp: "not-a-timestamp" },
  });
  assert.equal(result.readings.length, 0);
  assert.match(result.errors.join(" "), /invalid fields|valid timestamp/);
});

test("grain profiles remain unassessed until reviewed limits and a source exist", () => {
  assert.deepEqual(supportedGrainTypes, [
    "Rice",
    "Wheat",
    "Maize",
    "Ragi",
    "Jowar",
    "Bajra",
  ]);
  assert.equal(
    assessStorageCondition(getGrainProfile("Rice"), {
      temperatureC: 20,
      humidityPercent: 40,
    }),
    "not-assessed",
  );
  assert.equal(
    assessStorageCondition(
      {
        source: null,
        thresholds: {
          temperatureC: { minimum: 0, maximum: 10 },
          humidityPercent: { minimum: 0, maximum: 50 },
        },
      },
      { temperatureC: 20, humidityPercent: 40 },
    ),
    "not-assessed",
  );
});
