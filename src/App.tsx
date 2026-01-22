import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/main-layout';

// Pages - will be implemented
import Dashboard from '@/pages/dashboard';
import SystemDashboard from '@/pages/system-dashboard';
import AINews from '@/pages/ai-news';
import HomeworkPage from '@/pages/homework';
import ChinesePage from '@/pages/homework/chinese';
import MathPage from '@/pages/homework/math';
import EnglishPage from '@/pages/homework/english';
import WordbookPage from '@/pages/wordbook';
import MemberList from '@/pages/members';
import MemberDetail from '@/pages/member-detail';
import Documents from '@/pages/documents';
import Addresses from '@/pages/addresses';
import BankAccounts from '@/pages/bank-accounts';
import Files from '@/pages/files';
import FormFilling from '@/pages/form-filling';
import Settings from '@/pages/settings';
import ServiceCatalog from '@/pages/service-catalog';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="system" element={<SystemDashboard />} />
        <Route path="services" element={<ServiceCatalog />} />
        <Route path="ai-news" element={<AINews />} />
        <Route path="homework" element={<HomeworkPage />} />
        <Route path="homework/chinese" element={<ChinesePage />} />
        <Route path="homework/math" element={<MathPage />} />
        <Route path="homework/english" element={<EnglishPage />} />
        <Route path="wordbook" element={<WordbookPage />} />
        <Route path="members" element={<MemberList />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="documents" element={<Documents />} />
        <Route path="addresses" element={<Addresses />} />
        <Route path="bank-accounts" element={<BankAccounts />} />
        <Route path="files" element={<Files />} />
        <Route path="form-filling" element={<FormFilling />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
