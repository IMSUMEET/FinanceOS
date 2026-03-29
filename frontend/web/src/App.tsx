import { Route, Routes } from "react-router-dom";
import AppShell from "./shared/layout/AppShell";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import SharedExpensesPage from "./features/shared-expenses/pages/SharedExpensesPage";
import GroupDetailPage from "./features/shared-expenses/pages/GroupDetailPage";
import SubscriptionsPage from "./features/subscriptions/pages/SubscriptionsPage";
import LoansPage from "./features/loans/pages/LoansPage";
import SpendAnalyzerPage from "./features/spend-analyzer/pages/SpendAnalyzerPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/shared-expenses" element={<SharedExpensesPage />} />
        <Route
          path="/shared-expenses/groups/:groupId"
          element={<GroupDetailPage />}
        />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/spend-analyzer" element={<SpendAnalyzerPage />} />
      </Route>
    </Routes>
  );
}
