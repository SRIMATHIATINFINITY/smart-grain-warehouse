const styles = {
  online: "bg-emerald-50 text-emerald-800",
  offline: "bg-rose-50 text-rose-800",
  unknown: "bg-stone-100 text-stone-600",
  available: "bg-emerald-50 text-emerald-800",
  "no-data": "bg-amber-50 text-amber-900",
  "sensor-error": "bg-rose-50 text-rose-800",
  error: "bg-rose-50 text-rose-800",
  loading: "bg-stone-100 text-stone-600",
  "not-assessed": "bg-amber-50 text-amber-900",
  "insufficient-data": "bg-amber-50 text-amber-900",
  attention: "bg-orange-50 text-orange-800",
  "within-profile": "bg-emerald-50 text-emerald-800",
};

const labels = {
  online: "Online",
  offline: "Offline",
  unknown: "Status not reported",
  available: "Available",
  "no-data": "No data",
  "sensor-error": "Sensor error",
  error: "Read error",
  loading: "Loading",
  "not-assessed": "Not assessed",
  "insufficient-data": "Insufficient data",
  attention: "Outside configured profile",
  "within-profile": "Within configured profile",
};

function StatusBadge({ status, label }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${styles[status] ?? styles.unknown}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label ?? labels[status] ?? "Unknown"}
    </span>
  );
}

export default StatusBadge;
