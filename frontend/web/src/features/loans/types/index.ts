export type LoanPayment = {
  id: string;
  date: string;
  totalAmount: number;
  principalAmount: number;
  interestAmount: number;
};

export type Loan = {
  id: string;
  name: string;
  originalAmount: number;
  remainingBalance: number;
  interestRate: number;
  monthlyPayment: number;
  payments: LoanPayment[];
};
