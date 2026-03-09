import { Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import DashboardPage from "./modules/dashboard/DashboardPage";
import SharedExpensesPage from "./modules/shared-expenses/SharedExpensesPage";
import SubscriptionsPage from "./modules/subscriptions/SubscriptionsPage";
import LoansPage from "./modules/loans/LoansPage";
import FinancialTrackerPage from "./modules/financial-tracker/FinancialTrackerPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/shared-expenses" element={<SharedExpensesPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/financial-tracker" element={<FinancialTrackerPage />} />
      </Route>
    </Routes>
  );
}
