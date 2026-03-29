import type { Loan } from "../types";

export const mockLoans: Loan[] = [
  {
    id: "loan1",
    name: "Student Loan",
    originalAmount: 90000,
    remainingBalance: 62400,
    interestRate: 8.1,
    monthlyPayment: 2000,
    payments: [
      {
        id: "p1",
        date: "2026-01-01",
        totalAmount: 2000,
        principalAmount: 1260,
        interestAmount: 740,
      },
      {
        id: "p2",
        date: "2026-02-01",
        totalAmount: 2000,
        principalAmount: 1284,
        interestAmount: 716,
      },
    ],
  },
];
