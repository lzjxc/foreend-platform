import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/main-layout';

// Pages
import Dashboard from '@/pages/dashboard';
import SystemDashboard from '@/pages/system-dashboard';
import HomeworkPage from '@/pages/homework';
import ChinesePage from '@/pages/homework/chinese';
import MathPage from '@/pages/homework/math';
import EnglishPage from '@/pages/homework/english';
import GradingPage from '@/pages/homework/grading';
import WordbookPage from '@/pages/wordbook';
import MemberList from '@/pages/members';
import MemberDetail from '@/pages/member-detail';
import Files from '@/pages/files';
import FormFilling from '@/pages/form-filling';
import Finance from '@/pages/finance';
import Settings from '@/pages/settings';
import ServiceCatalog from '@/pages/service-catalog';
import DataSources from '@/pages/data-sources';
import EfficiencyEvaluator from '@/pages/efficiency-evaluator';
import DocsPage from '@/pages/docs';
import TimelinePage from '@/pages/timeline';
import ArgoConfigPage from '@/pages/argo-config';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="system" element={<SystemDashboard />} />
        <Route path="services" element={<ServiceCatalog />} />
        <Route path="efficiency" element={<EfficiencyEvaluator />} />
        <Route path="data-sources" element={<DataSources />} />
        <Route path="docs" element={<DocsPage />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="argo-config" element={<ArgoConfigPage />} />
        <Route path="homework" element={<HomeworkPage />} />
        <Route path="homework/chinese" element={<ChinesePage />} />
        <Route path="homework/math" element={<MathPage />} />
        <Route path="homework/english" element={<EnglishPage />} />
        <Route path="homework/grading" element={<GradingPage />} />
        <Route path="wordbook" element={<WordbookPage />} />
        <Route path="members" element={<MemberList />} />
        <Route path="members/:id" element={<MemberDetail />} />
        {/* Redirects for removed standalone pages */}
        <Route path="documents" element={<Navigate to="/members" replace />} />
        <Route path="addresses" element={<Navigate to="/members" replace />} />
        <Route path="bank-accounts" element={<Navigate to="/members" replace />} />
        <Route path="ai-news" element={<Navigate to="/dashboard" replace />} />
        <Route path="files" element={<Files />} />
        <Route path="form-filling" element={<FormFilling />} />
        <Route path="finance" element={<Finance />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
