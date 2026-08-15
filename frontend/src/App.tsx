import { Route, BrowserRouter, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ComplianceRecordsPage } from './pages/ComplianceRecordsPage';
import { ComplianceRecordFormPage } from './pages/ComplianceRecordFormPage';
import { UpcomingExpirationsPage } from './pages/UpcomingExpirationsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/compliance-records" element={<ComplianceRecordsPage />} />
          <Route path="/compliance-records/new" element={<ComplianceRecordFormPage />} />
          <Route path="/compliance-records/:id/edit" element={<ComplianceRecordFormPage />} />
          <Route path="/upcoming" element={<UpcomingExpirationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
