import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function TemperatureHistoryPlot({ readings }) {
  return (
    <div className="mt-5 h-56 w-full" aria-label="Temperature history chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={readings}
          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#e7e5e4"
            strokeDasharray="4 4"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#78716c", fontSize: 12 }}
          />
          <YAxis
            unit="°C"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#78716c", fontSize: 12 }}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="temperatureC"
            name="Temperature"
            stroke="#28734a"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TemperatureHistoryPlot;
