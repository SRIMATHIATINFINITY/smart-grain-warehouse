import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Droplets,
  Thermometer,
  Wind,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import SensorMetricCard from "../../components/SensorMetricCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { getDeviceStatus } from "../../domain/binData.js";
import { supportedGrainTypes } from "../../domain/grainProfiles.js";
import useWarehouseBins from "../../hooks/useWarehouseBins.js";

function Dashboard({ database }) {
  const { warehouseId = "" } = useParams();
  const { bins, status, error } = useWarehouseBins(database, warehouseId);
  const [grainFilter, setGrainFilter] = useState("all");
  const grainOptions = useMemo(() => {
    const observedTypes = bins
      .map((bin) => bin.metadata?.grainType)
      .filter(Boolean);
    return [...new Set([...supportedGrainTypes, ...observedTypes])];
  }, [bins]);
  const visibleBins =
    grainFilter === "all"
      ? bins
      : bins.filter((bin) => bin.metadata?.grainType === grainFilter);
  const onlineCount = bins.filter(
    (bin) => getDeviceStatus(bin.latest) === "online",
  ).length;
  const offlineCount = bins.filter(
    (bin) => getDeviceStatus(bin.latest) === "offline",
  ).length;

  return (
    <main className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-forest">
            <Boxes size={16} />
            Warehouse monitoring
          </p>
          <h1 className="break-all text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            {warehouseId}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
            View each storage bin independently. Readings are taken from the
            selected warehouse&apos;s bin directory and latest values.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
        >
          Change warehouse
          <ArrowRight size={16} />
        </Link>
      </section>

      {status === "error" && (
        <MessagePanel
          title="Could not read the bin directory"
          message={error || "Realtime Database access was denied."}
          tone="error"
        />
      )}

      {status !== "error" && (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Bins in directory" value={bins.length} icon={Boxes} />
            <SummaryCard label="Reported online" value={onlineCount} icon={Thermometer} />
            <SummaryCard label="Reported offline" value={offlineCount} icon={AlertTriangle} />
          </section>

          <section>
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Storage bins</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Each card represents one bin and its assigned ESP32.
                </p>
              </div>
              <label className="text-sm font-semibold text-stone-700">
                Filter by grain
                <select
                  value={grainFilter}
                  onChange={(event) => setGrainFilter(event.target.value)}
                  className="ml-2 min-w-40 rounded-xl border border-stone-300 bg-white px-3 py-2 font-normal outline-none focus:border-forest focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="all">All grains</option>
                  {grainOptions.map((grainType) => (
                    <option key={grainType} value={grainType}>
                      {grainType}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {status === "loading" && bins.length === 0 && (
              <MessagePanel
                title="Loading bins"
                message="Checking the authenticated bin directory..."
              />
            )}
            {status === "ready" && bins.length === 0 && (
              <MessagePanel
                title="No bins are listed yet"
                message={`No entries marked true were found at warehouses/${warehouseId}/binIndex. Add bin IDs to that directory through your trusted provisioning process; this dashboard will not create them.`}
              />
            )}
            {status === "ready" && bins.length > 0 && visibleBins.length === 0 && (
              <MessagePanel
                title="No bins match this grain"
                message="Choose another grain type or select All grains."
              />
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleBins.map((bin) => (
                <BinCard
                  key={bin.binId}
                  warehouseId={warehouseId}
                  bin={bin}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
        <Icon size={19} />
      </span>
      <div>
        <p className="text-xs font-medium text-stone-500">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-stone-900">{value}</p>
      </div>
    </div>
  );
}

function BinCard({ warehouseId, bin }) {
  const metadata = bin.metadata;
  const latest = bin.latest;
  const deviceStatus = getDeviceStatus(latest);
  const detailPath = `/warehouses/${encodeURIComponent(warehouseId)}/bins/${encodeURIComponent(bin.binId)}`;

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Bin
          </p>
          <h3 className="mt-1 break-all text-lg font-bold text-stone-900">
            {bin.binId}
          </h3>
        </div>
        <StatusBadge status={deviceStatus} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <Detail label="Grain" value={metadata?.grainType ?? "Metadata unavailable"} />
        <Detail label="ESP32 device" value={metadata?.deviceId ?? "Metadata unavailable"} />
      </dl>
      {bin.metadataErrors.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-rose-700">
          {bin.metadataErrors.join(" ")}
        </p>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-stone-100 pt-4">
        <MiniReading
          label="Temperature"
          value={latest?.temperatureC}
          unit="°C"
          icon={Thermometer}
        />
        <MiniReading
          label="Humidity"
          value={latest?.humidityPercent}
          unit="%"
          icon={Droplets}
        />
        <MiniReading
          label="Gas"
          value={latest?.gas?.value}
          unit={latest?.gas?.unit}
          icon={Wind}
        />
      </div>
      {bin.latestErrors.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-rose-700">
          {bin.latestErrors.join(" ")}
        </p>
      )}
      {bin.latestState === "no-data" && (
        <p className="mt-3 text-xs text-stone-500">
          No sensor reading has been reported for this bin.
        </p>
      )}
      <Link
        to={detailPath}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
      >
        Open bin details
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-stone-50 px-3 py-2.5">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-0.5 break-all text-sm font-semibold text-stone-800">
        {value}
      </dd>
    </div>
  );
}

function MiniReading({ label, value, unit, icon: Icon }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-stone-400">
        <Icon size={13} />
        <span className="truncate text-[10px] font-medium">{label}</span>
      </div>
      <p className="mt-1 truncate text-sm font-bold text-stone-800">
        {typeof value === "number" && Number.isFinite(value) ? value : "--"}
        {unit ? <span className="ml-1 text-[10px] font-medium text-stone-500">{unit}</span> : null}
      </p>
    </div>
  );
}

function MessagePanel({ title, message, tone = "neutral" }) {
  const classes =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-950"
      : "border-stone-200 bg-white text-stone-900";
  return (
    <section className={`rounded-2xl border p-5 ${classes}`} role={tone === "error" ? "alert" : undefined}>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 break-words text-sm leading-6 opacity-80">{message}</p>
    </section>
  );
}

export default Dashboard;
