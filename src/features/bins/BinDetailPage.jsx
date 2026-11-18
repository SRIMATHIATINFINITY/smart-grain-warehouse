import {
  ArrowLeft,
  Bot,
  Droplets,
  Thermometer,
  Wind,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import SensorMetricCard from "../../components/SensorMetricCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import {
  getDeviceStatus,
  parseTimestamp,
} from "../../domain/binData.js";
import {
  assessStorageCondition,
  getGrainProfile,
} from "../../domain/grainProfiles.js";
import useBinDetails from "../../hooks/useBinDetails.js";
import SensorHistoryChart from "../dashboard/SensorHistoryChart.jsx";

function BinDetailPage({ database }) {
  const { warehouseId = "", binId = "" } = useParams();
  const { bin, status, error } = useBinDetails(database, warehouseId, binId);
  const backPath = `/warehouses/${encodeURIComponent(warehouseId)}`;

  if (status === "loading" || !bin) {
    if (status === "error") {
      return (
        <PageMessage
          title="Could not open this bin"
          message={error || "Realtime Database access was denied."}
          error
          backPath={backPath}
        />
      );
    }

    return (
      <PageMessage
        title="Loading bin details"
        message="Checking the authenticated bin directory..."
        backPath={backPath}
      />
    );
  }

  if (bin.status === "error") {
    return (
      <PageMessage
        title="Could not open this bin"
        message={bin.indexError || error || "Realtime Database access was denied."}
        error
        backPath={backPath}
      />
    );
  }

  if (bin.status === "not-found") {
    return (
      <PageMessage
        title="This bin is not in the directory"
        message={`No true entry was found at warehouses/${warehouseId}/binIndex/${binId}.`}
        backPath={backPath}
      />
    );
  }

  const metadata = bin.metadata;
  const latest = bin.latest;
  const grainProfile = getGrainProfile(metadata?.grainType);
  const conditionStatus = assessStorageCondition(grainProfile, latest);
  const deviceStatus = getDeviceStatus(latest);
  const temperatureState = getMetricState(bin.latestState, latest?.temperatureC);
  const humidityState = getMetricState(bin.latestState, latest?.humidityPercent);
  const gasState = getMetricState(bin.latestState, latest?.gas?.value);
  const lastUpdated = latest?.timestamp
    ? formatTimestamp(latest.timestamp)
    : "Timestamp not reported";

  return (
    <main className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <Link
        to={backPath}
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-forest"
      >
        <ArrowLeft size={17} />
        Back to warehouse
      </Link>

      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold text-forest">
            Warehouse {warehouseId}
          </p>
          <h1 className="break-all text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Bin {binId}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Grain: <strong className="font-semibold text-stone-800">{metadata?.grainType ?? "Not configured"}</strong>
            <span className="mx-2 text-stone-300">|</span>
            Device: <strong className="break-all font-semibold text-stone-800">{metadata?.deviceId ?? "Not configured"}</strong>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={deviceStatus} />
          <span className="text-xs text-stone-500">Last update: {lastUpdated}</span>
        </div>
      </section>

      {bin.metadataErrors.length > 0 && (
        <ErrorNotice title="Bin metadata needs attention" messages={bin.metadataErrors} />
      )}
      {bin.latestState === "error" && (
        <ErrorNotice title="Could not read the latest value" messages={bin.latestErrors} />
      )}
      {bin.latestState === "sensor-error" && (
        <ErrorNotice title="The latest device data contains errors" messages={bin.latestErrors} />
      )}
      {latest?.sensorErrors?.length > 0 && (
        <ErrorNotice title="Sensor reported an error" messages={latest.sensorErrors} />
      )}

      <section aria-labelledby="readings-heading">
        <div className="mb-4">
          <h2 id="readings-heading" className="text-xl font-bold text-stone-900">
            Latest readings
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Values are shown as sent by this bin&apos;s ESP32; gas units are not converted.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <SensorMetricCard
            label="Temperature"
            value={latest?.temperatureC}
            unit="°C"
            icon={Thermometer}
            tone="orange"
            state={temperatureState}
          />
          <SensorMetricCard
            label="Humidity"
            value={latest?.humidityPercent}
            unit="% RH"
            icon={Droplets}
            tone="blue"
            state={humidityState}
          />
          <SensorMetricCard
            label="Gas sensor"
            value={latest?.gas?.value}
            unit={latest?.gas?.unit}
            icon={Wind}
            tone="violet"
            state={gasState}
            note={latest?.gas ? "Device-reported value and unit" : "No calibrated value or raw ADC reading"}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Grain storage condition</h2>
              <p className="mt-1 text-sm text-stone-500">
                Profile for {grainProfile.name || "this grain"}
              </p>
            </div>
            <StatusBadge status={conditionStatus} />
          </div>
          <p className="mt-5 text-sm leading-6 text-stone-600">
            {conditionStatus === "not-assessed"
              ? "No sourced, reviewed storage limits are configured for this grain. Condition is intentionally not assessed."
              : conditionStatus === "insufficient-data"
                ? "Current temperature and humidity readings are incomplete."
                : conditionStatus === "attention"
                  ? "At least one reading is outside the configured, sourced grain profile."
                  : "Current readings are within the configured, sourced grain profile."}
          </p>
          {grainProfile.source && (
            <p className="mt-3 break-words text-xs text-stone-500">
              Profile source: {grainProfile.source}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">TinyML device output</h2>
              <p className="mt-1 text-sm text-stone-500">Inference performed by this bin&apos;s ESP32</p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Bot size={22} />
            </span>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <Info label="Risk label" value={latest?.riskLabel || "Not reported"} />
            <Info
              label="Risk score (as sent)"
              value={latest?.riskScore === null || latest?.riskScore === undefined
                ? "Not reported"
                : String(latest.riskScore)}
            />
            <Info label="Model version" value={latest?.modelVersion || "Not reported"} />
            <Info label="Connectivity" value={deviceStatus === "unknown" ? "Not reported" : deviceStatus} />
          </dl>
          <p className="mt-4 text-xs leading-5 text-stone-500">
            This is device-provided model output. It is not presented as a
            scientifically validated spoilage prediction.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <SensorHistoryChart readings={bin.history} />
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-stone-900">History status</h2>
          <div className="mt-4">
            <StatusBadge status={bin.historyState} />
          </div>
          {bin.historyState === "no-data" && (
            <p className="mt-4 text-sm leading-6 text-stone-500">
              No historical readings are available for this bin yet.
            </p>
          )}
          {bin.historyErrors.length > 0 && (
            <div className="mt-4">
              <ErrorNotice title="Some history entries could not be displayed" messages={bin.historyErrors} />
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-stone-500">
            The detail page requests only the latest 200 history entries.
          </p>
        </div>
      </section>
    </main>
  );
}

function getMetricState(latestState, value) {
  if (latestState === "error" || latestState === "sensor-error") {
    return "sensor-error";
  }
  return typeof value === "number" && Number.isFinite(value)
    ? "available"
    : "no-data";
}

function formatTimestamp(timestamp) {
  const milliseconds = parseTimestamp(timestamp);
  return milliseconds === null
    ? "Timestamp not reported"
    : new Date(milliseconds).toLocaleString("en-IN");
}

function Info({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-stone-50 px-3.5 py-3">
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-stone-800">{value}</dd>
    </div>
  );
}

function ErrorNotice({ title, messages }) {
  return (
    <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-950" role="alert">
      <h2 className="text-sm font-semibold">{title}</h2>
      {messages.map((message, index) => (
        <p className="mt-1 break-words text-sm leading-5" key={`${index}-${message}`}>
          {message}
        </p>
      ))}
    </section>
  );
}

function PageMessage({ title, message, error = false, backPath }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className={`rounded-2xl border p-5 ${error ? "border-rose-200 bg-rose-50" : "border-stone-200 bg-white"}`}>
        <h1 className="font-bold text-stone-900">{title}</h1>
        <p className="mt-2 break-words text-sm leading-6 text-stone-600">{message}</p>
        {backPath && (
          <Link to={backPath} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-forest">
            <ArrowLeft size={16} />
            Back to warehouse
          </Link>
        )}
      </section>
    </main>
  );
}

export default BinDetailPage;
