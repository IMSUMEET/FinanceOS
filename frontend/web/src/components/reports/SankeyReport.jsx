import { useMemo } from "react";

function SankeyReport({ transactions }) {
  const data = useMemo(() => {
    const incomeTx = transactions.filter(t => t.amount > 0 && t.category !== "Credit Card Payments");
    const expenseTx = transactions.filter(t => t.amount < 0 && t.category !== "Credit Card Payments");

    const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netSavings = totalIncome > totalExpenses ? totalIncome - totalExpenses : 0;

    // Group expenses by category
    const expenseMap = {};
    for (const t of expenseTx) {
      expenseMap[t.category] = (expenseMap[t.category] ?? 0) + Math.abs(t.amount);
    }
    const categories = Object.entries(expenseMap).map(([cat, total]) => ({
      name: cat,
      total,
      percentage: totalIncome > 0 ? (total / totalIncome) * 100 : 0,
    })).sort((a, b) => b.total - a.total);

    // Sum of all outlays (expenses + savings) to normalize right-side heights
    const totalRightValue = totalExpenses + netSavings;

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsPercentage: totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0,
      categories,
      totalRightValue,
    };
  }, [transactions]);

  if (data.totalIncome === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-ink-500">
        No income record found to build the Cash Flow Sankey.
      </div>
    );
  }

  // Draw pure SVG nodes & bezier paths
  const height = 450;
  const width = 900;
  const nodeWidth = 24;

  const leftNode = { x: 140, y: 60, h: 320, name: "Paychecks", val: data.totalIncome };
  const midNode = { x: 400, y: 60, h: 320, name: "Income", val: data.totalIncome };

  // Generate right nodes positions
  const rightX = 660;
  const totalRightItems = (data.netSavings > 0 ? 1 : 0) + data.categories.length;
  const gap = 14;
  const availableHeight = height - 120 - (totalRightItems - 1) * gap;

  let currentY = 60;
  const rightNodes = [];

  // Add Savings if positive
  if (data.netSavings > 0) {
    const h = (data.netSavings / data.totalRightValue) * availableHeight;
    rightNodes.push({
      name: "Savings",
      val: data.netSavings,
      pct: data.savingsPercentage,
      x: rightX,
      y: currentY,
      h: Math.max(h, 18),
      color: "#10B981", // Emerald
    });
    currentY += Math.max(h, 18) + gap;
  }

  // Add Category nodes
  const colors = ["#F59E0B", "#3B82F6", "#EC4899", "#8B5CF6", "#EF4444", "#6B7280"];
  data.categories.forEach((cat, idx) => {
    const h = (cat.total / data.totalRightValue) * availableHeight;
    rightNodes.push({
      name: cat.name,
      val: cat.total,
      pct: cat.percentage,
      x: rightX,
      y: currentY,
      h: Math.max(h, 18),
      color: colors[idx % colors.length],
    });
    currentY += Math.max(h, 18) + gap;
  });

  // Calculate links from middle node to right nodes using cumulative heights
  let currentMidY = midNode.y;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 border-b border-ink-100 pb-4 dark:border-ink-800">
        <div className="rounded-xl border border-ink-150 p-4 dark:border-ink-800">
          <p className="text-xs text-ink-500">Total Income</p>
          <p className="text-xl font-black text-emerald-500">${data.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="rounded-xl border border-ink-150 p-4 dark:border-ink-800">
          <p className="text-xs text-ink-500">Total Expenses</p>
          <p className="text-xl font-black text-rose-500">${data.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="rounded-xl border border-ink-150 p-4 dark:border-ink-800">
          <p className="text-xs text-ink-500">Savings Rate</p>
          <p className="text-xl font-black text-brand">{data.savingsPercentage.toFixed(1)}%</p>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[800px] h-auto">
          {/* Bezier link from Paychecks to Income */}
          <path
            d={`M ${leftNode.x + nodeWidth} ${leftNode.y + leftNode.h/2} C ${(leftNode.x + midNode.x)/2} ${leftNode.y + leftNode.h/2}, ${(leftNode.x + midNode.x)/2} ${midNode.y + midNode.h/2}, ${midNode.x} ${midNode.y + midNode.h/2}`}
            fill="none"
            stroke="url(#incomeGradient)"
            strokeWidth={leftNode.h}
            opacity="0.25"
          />

          {/* Links from Income to right nodes */}
          {rightNodes.map((node, idx) => {
            const nodeShareHeight = (node.val / data.totalRightValue) * midNode.h;
            const startY = currentMidY + nodeShareHeight / 2;
            const endY = node.y + node.h / 2;
            
            // Advance tracker
            currentMidY += nodeShareHeight;

            return (
              <path
                key={idx}
                d={`M ${midNode.x + nodeWidth} ${startY} C ${(midNode.x + node.x)/2} ${startY}, ${(midNode.x + node.x)/2} ${endY}, ${node.x} ${endY}`}
                fill="none"
                stroke={node.color}
                strokeWidth={node.h}
                opacity="0.2"
                className="hover:opacity-45 transition cursor-pointer"
              />
            );
          })}

          {/* Left Node: Paychecks */}
          <rect x={leftNode.x} y={leftNode.y} width={nodeWidth} height={leftNode.h} fill="#0284c7" rx="4" />
          <text x={leftNode.x - 12} y={leftNode.y + leftNode.h / 2} textAnchor="end" dominantBaseline="middle" className="text-xs font-black fill-ink-900 dark:fill-ink-100">
            {leftNode.name}
          </text>
          <text x={leftNode.x - 12} y={leftNode.y + leftNode.h / 2 + 14} textAnchor="end" dominantBaseline="middle" className="text-[10px] fill-ink-500 font-mono">
            ${leftNode.val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </text>

          {/* Mid Node: Income */}
          <rect x={midNode.x} y={midNode.y} width={nodeWidth} height={midNode.h} fill="#10B981" rx="4" />
          <text x={midNode.x + nodeWidth / 2} y={midNode.y - 12} textAnchor="middle" className="text-xs font-black fill-ink-900 dark:fill-ink-100">
            {midNode.name}
          </text>

          {/* Right Nodes (Savings, Categories) */}
          {rightNodes.map((node, idx) => (
            <g key={idx}>
              <rect x={node.x} y={node.y} width={nodeWidth} height={node.h} fill={node.color} rx="4" />
              <text x={node.x + nodeWidth + 12} y={node.y + node.h / 2} dominantBaseline="middle" className="text-[11px] font-bold fill-ink-900 dark:fill-ink-100">
                {node.name}
              </text>
              <text x={node.x + nodeWidth + 12} y={node.y + node.h / 2 + 13} dominantBaseline="middle" className="text-[9px] fill-ink-500 font-mono">
                ${node.val.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({node.pct.toFixed(1)}%)
              </text>
            </g>
          ))}

          {/* Gradients */}
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

export default SankeyReport;
