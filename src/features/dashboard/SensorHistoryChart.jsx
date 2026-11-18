import { ChartNoAxesCombined } from "lucide-react";
import { lazy, Suspense } from "react";

const TemperatureHistoryPlot = lazy(() => import("./TemperatureHistoryPlot.jsx"));

function SensorHistoryChart({ readings }) {
  const hasReadings = readings.some(
    (reading) =>
      typeof reading.temperatureC === "number" &&
      Number.isFinite(reading.temperatureC),
  );

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Sensor history</h2>
          <p className="mt-1 text-sm text-stone-500">
            Temperature readings over time
          </p>
        </div>
        <span className="rounded-lg bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-500">
          History
        </span>
      </div>
      {hasReadings ? (
        <Suspense
          fallback={
            <div className="mt-5 flex min-h-56 items-center justify-center text-sm text-stone-500">
              Loading sensor history...
            </div>
          }
        >
          <TemperatureHistoryPlot readings={readings} />
        </Suspense>
      ) : (
        <div className="mt-5 flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/60 px-5 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-stone-400 shadow-sm">
            <ChartNoAxesCombined size={23} />
          </span>
          <p className="mt-3 text-sm font-semibold text-stone-700">
            No temperature history to show yet
          </p>
          <p className="mt-1 max-w-sm text-sm leading-5 text-stone-500">
            Temperature history will appear after timestamped temperature
            readings are received.
          </p>
        </div>
      )}
    </section>
  );
}

export default SensorHistoryChart;
