import {
  limitToLast,
  onValue,
  query,
  ref,
} from "firebase/database";
import {
  isValidFirebaseKey,
  parseBinMetadata,
  parseHistory,
  parseSensorReading,
} from "../../domain/binData.js";

const HISTORY_LIMIT = 200;

function isIndexedBin(value) {
  return value === true;
}

function parseLatest(rawLatest) {
  if (rawLatest === null) {
    return {
      latest: null,
      latestState: "no-data",
      latestErrors: [],
    };
  }

  const parsed = parseSensorReading(rawLatest);
  const latestState =
    parsed.errors.length > 0 || parsed.sensorErrors.length > 0
      ? "sensor-error"
      : parsed.reading?.hasAnyData
        ? "available"
        : "no-data";

  return {
    latest: parsed.reading,
    latestState,
    latestErrors: [...parsed.errors, ...parsed.sensorErrors],
  };
}

function createBinState(binId) {
  return {
    binId,
    metadata: null,
    metadataState: "loading",
    metadataErrors: [],
    latest: null,
    latestState: "loading",
    latestErrors: [],
  };
}

function subscribeToBinSummary(database, warehouseId, binId, state, emit) {
  const path = `warehouses/${warehouseId}/bins/${binId}`;
  const unsubscribers = [
    onValue(
      ref(database, `${path}/metadata`),
      (snapshot) => {
        const result = parseBinMetadata(binId, snapshot.val());
        state.metadata = result.metadata;
        state.metadataErrors = result.errors;
        state.metadataState = result.metadata ? "available" : "sensor-error";
        emit();
      },
      (error) => {
        state.metadata = null;
        state.metadataErrors = [error.message];
        state.metadataState = "error";
        emit();
      },
    ),
    onValue(
      ref(database, `${path}/latest`),
      (snapshot) => {
        Object.assign(state, parseLatest(snapshot.val()));
        emit();
      },
      (error) => {
        state.latest = null;
        state.latestErrors = [error.message];
        state.latestState = "error";
        emit();
      },
    ),
  ];

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export function subscribeToWarehouseBins(
  database,
  warehouseId,
  onUpdate,
  onError,
) {
  if (!isValidFirebaseKey(warehouseId)) {
    throw new Error("The warehouse ID is not a valid Realtime Database key.");
  }

  const states = new Map();
  const binUnsubscribers = new Map();
  let stopped = false;

  const emit = () => {
    if (!stopped) {
      onUpdate(
        [...states.values()].map((state) => ({ ...state })).sort((a, b) =>
          a.binId.localeCompare(b.binId),
        ),
      );
    }
  };

  const unsubscribeIndex = onValue(
    ref(database, `warehouses/${warehouseId}/binIndex`),
    (snapshot) => {
      const index = snapshot.val();
      const indexedBinIds =
        index && typeof index === "object" && !Array.isArray(index)
          ? Object.entries(index)
              .filter(
                ([binId, included]) =>
                  included === true && isValidFirebaseKey(binId),
              )
              .map(([binId]) => binId)
          : [];
      const nextIds = new Set(indexedBinIds);

      for (const [binId, unsubscribe] of binUnsubscribers) {
        if (!nextIds.has(binId)) {
          unsubscribe();
          binUnsubscribers.delete(binId);
          states.delete(binId);
        }
      }

      for (const binId of indexedBinIds) {
        if (states.has(binId)) continue;
        const state = createBinState(binId);
        states.set(binId, state);
        binUnsubscribers.set(
          binId,
          subscribeToBinSummary(database, warehouseId, binId, state, emit),
        );
      }

      emit();
    },
    onError,
  );

  return () => {
    stopped = true;
    unsubscribeIndex();
    for (const unsubscribe of binUnsubscribers.values()) unsubscribe();
    binUnsubscribers.clear();
    states.clear();
  };
}

export function subscribeToBin(
  database,
  warehouseId,
  binId,
  onUpdate,
  onError,
) {
  if (!isValidFirebaseKey(warehouseId) || !isValidFirebaseKey(binId)) {
    throw new Error("The warehouse ID or bin ID is not a valid database key.");
  }

  const state = {
    status: "loading",
    binId,
    metadata: null,
    metadataState: "loading",
    metadataErrors: [],
    latest: null,
    latestState: "loading",
    latestErrors: [],
    history: [],
    historyState: "loading",
    historyErrors: [],
  };
  let childUnsubscribers = [];
  let stopped = false;

  const emit = () => {
    if (!stopped) onUpdate({ ...state, history: [...state.history] });
  };

  const clearBinListeners = () => {
    childUnsubscribers.forEach((unsubscribe) => unsubscribe());
    childUnsubscribers = [];
  };

  const unsubscribeIndex = onValue(
    ref(database, `warehouses/${warehouseId}/binIndex/${binId}`),
    (snapshot) => {
      if (!isIndexedBin(snapshot.val())) {
        clearBinListeners();
        state.status = "not-found";
        state.metadata = null;
        state.latest = null;
        state.history = [];
        state.metadataState = "no-data";
        state.latestState = "no-data";
        state.historyState = "no-data";
        emit();
        return;
      }

      if (state.status === "available") return;
      state.status = "available";
      const path = `warehouses/${warehouseId}/bins/${binId}`;
      childUnsubscribers = [
        onValue(
          ref(database, `${path}/metadata`),
          (metadataSnapshot) => {
            const result = parseBinMetadata(binId, metadataSnapshot.val());
            state.metadata = result.metadata;
            state.metadataErrors = result.errors;
            state.metadataState = result.metadata ? "available" : "sensor-error";
            emit();
          },
          (error) => {
            state.metadata = null;
            state.metadataErrors = [error.message];
            state.metadataState = "error";
            emit();
          },
        ),
        onValue(
          ref(database, `${path}/latest`),
          (latestSnapshot) => {
            Object.assign(state, parseLatest(latestSnapshot.val()));
            emit();
          },
          (error) => {
            state.latest = null;
            state.latestErrors = [error.message];
            state.latestState = "error";
            emit();
          },
        ),
        onValue(
          query(ref(database, `${path}/history`), limitToLast(HISTORY_LIMIT)),
          (historySnapshot) => {
            const result = parseHistory(historySnapshot.val());
            state.history = result.readings;
            state.historyErrors = result.errors;
            state.historyState =
              result.errors.length > 0
                ? "sensor-error"
                : result.readings.length > 0
                  ? "available"
                  : "no-data";
            emit();
          },
          (error) => {
            state.history = [];
            state.historyErrors = [error.message];
            state.historyState = "error";
            emit();
          },
        ),
      ];
      emit();
    },
    (error) => {
      clearBinListeners();
      state.status = "error";
      state.indexError = error.message;
      emit();
      onError?.(error);
    },
  );

  return () => {
    stopped = true;
    unsubscribeIndex();
    clearBinListeners();
  };
}
