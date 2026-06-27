import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import SafeResponsiveContainer from "../charts/SafeResponsiveContainer";

function IncomeReport({ transactions }) {
  const data = useMemo(() => {
    const incomeTx = transactions.filter(
      (t) => t.amount > 0 && t.category !== "Credit Card Payments",
    );
    const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);

    const sources = {
      Salary: 0,
      Bonus: 0,
      Interest: 0,
      Dividends: 0,
      Freelance: 0,
      Other: 0,
    };

    for (const t of incomeTx) {
      const desc = `${t.merchant_normalized || ""} ${t.description || ""}`.toLowerCase();
      if (
        desc.includes("salary") ||
        desc.includes("paycheck") ||
        desc.includes("deposit") ||
        desc.includes("payroll")
      ) {
        sources.Salary += t.amount;
      } else if (desc.includes("bonus")) {
        sources.Bonus += t.amount;
      } else if (desc.includes("interest")) {
        sources.Interest += t.amount;
      } else if (desc.includes("dividend")) {
        sources.Dividends += t.amount;
      } else if (
        desc.includes("freelance") ||
        desc.includes("gig") ||
        desc.includes("stripe") ||
        desc.includes("consult")
      ) {
        sources.Freelance += t.amount;
      } else {
        sources.Other += t.amount;
      }
    }

    return Object.entries(sources)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
        percentage: totalIncome > 0 ? ((value / totalIncome) * 100).toFixed(1) : 0,
      }))
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalIncomeVal = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  if (totalIncomeVal === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-ink-500">
        No positive income entries found in dataset to analyze sources.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-ink-100 pb-3 dark:border-ink-800">
        <div>
          <h3 className="text-md font-bold text-ink-900 dark:text-ink-50">
            Income Source Distribution
          </h3>
          <p className="text-xs text-ink-500">Classifying inflows by standard earnings channels</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-500">Total Inflow</p>
          <p className="text-lg font-black text-emerald-500">${totalIncomeVal.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 items-center">
        <SafeResponsiveContainer className="h-[250px] w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
          >
            <XAxis type="number" stroke="#888" fontSize={10} />
            <YAxis dataKey="name" type="category" stroke="#888" fontSize={10} width={70} />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </SafeResponsiveContainer>

        {/* Legend listing */}
        <div className="space-y-3">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex justify-between items-center text-sm border-b border-ink-50 pb-2 dark:border-ink-900/50"
            >
              <span className="font-semibold text-ink-850 dark:text-ink-200">{item.name}</span>
              <div className="text-right font-mono">
                <span className="font-bold text-ink-900 dark:text-ink-50">
                  ${item.value.toLocaleString()}
                </span>
                <span className="text-ink-400 text-xs ml-2">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IncomeReport;
