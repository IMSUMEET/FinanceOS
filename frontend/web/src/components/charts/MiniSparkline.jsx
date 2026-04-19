import { Area, AreaChart, ResponsiveContainer } from "recharts";

function MiniSparkline({ data, color = "#3b82f6", height = 48 }) {
  const safe = data?.length ? data : [{ v: 0 }, { v: 0 }];
  return (
    <div className="select-none pointer-events-none" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={safe} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${color})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MiniSparkline;
