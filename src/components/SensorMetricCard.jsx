import { AlertTriangle } from "lucide-react";

function SensorMetricCard({
  label,
  value,
  unit,
  icon: Icon,
  tone,
  state,
  note,
}) {
  const tones = {
    orange: "bg-orange-50 text-orange-700",
    blue: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
  };
  const hasValue = typeof value === "number" && Number.isFinite(value);
  const valueLabel = hasValue
    ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : "--";

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`flex size-11 items-center justify-center rounded-xl ${tones[tone]}`}>
            <Icon size={21} />
          </span>
          <h2 className="font-semibold text-stone-700">{label}</h2>
        </div>
        {state === "sensor-error" && (
          <AlertTriangle className="text-rose-600" size={18} aria-label="Sensor error" />
        )}
      </div>
      <div className="mt-6 flex items-end gap-2">
        <span className={`text-3xl font-bold tracking-tight ${hasValue ? "text-stone-900" : "text-stone-400"}`}>
          {valueLabel}
        </span>
        {unit && <span className="pb-1 text-sm font-medium text-stone-500">{unit}</span>}
      </div>
      <p className="mt-2 text-xs leading-5 text-stone-500">
        {note || (hasValue ? "Latest device reading" : "No reading available")}
      </p>
    </article>
  );
}

export default SensorMetricCard;
