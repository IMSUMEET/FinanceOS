import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import OverviewPage from "./pages/OverviewPage";
import TransactionsPage from "./pages/TransactionsPage";
import CategoriesPage from "./pages/CategoriesPage";
import InsightsPage from "./pages/InsightsPage";
import UploadPage from "./pages/UploadPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import HelpSupportPage from "./pages/HelpSupportPage";
import HouseSaleCalculator from "./pages/HouseSaleCalculator";
import RulesPage from "./pages/RulesPage";
import ReportsPage from "./pages/ReportsPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:name" element={<CategoriesPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/insights/ai" element={<InsightsPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/help" element={<HelpSupportPage />} />
          <Route path="/house-sale" element={<HouseSaleCalculator />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
