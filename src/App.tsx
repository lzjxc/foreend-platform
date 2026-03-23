import { Routes, Route, Navigate, useParams } from 'react-router-dom';
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
import DocsLayout from '@/pages/docs-layout';
import TimelinePage from '@/pages/timeline';
import ArgoConfigPage from '@/pages/argo-config';
import MachinesPage from '@/pages/machines';
import KnowledgePage from '@/pages/knowledge';
import KnowledgeReviewPage from '@/pages/knowledge-review';
import KnowledgePlansPage from '@/pages/knowledge-plans';
import KnowledgePlanDetailPage from '@/pages/knowledge-plan-detail';
import MembersLayout from '@/pages/members-layout';
import GameDevLanding from '@/pages/game-dev-landing';
import GameDevLayout from '@/pages/game-dev-layout';
import GameDevWorkbench from '@/pages/game-dev-workbench';
import GameDevAtoms from '@/pages/game-dev-atoms';
import GameDevOriginals from '@/pages/game-dev-originals';
import GameDevModifiers from '@/pages/game-dev-modifiers';
import GameDevRules from '@/pages/game-dev-rules';
import GameDevWorkshop from '@/pages/game-dev-workshop';
import GameDevWorkshopDetail from '@/pages/game-dev-workshop-detail';
import GameDevArt2DLayout from '@/pages/game-dev-art2d-layout';
import GameDevArt2DGenerator from '@/pages/game-dev-art2d-generator';
import GameDevArt2DHistory from '@/pages/game-dev-art2d-history';
import MsgGateway from '@/pages/msg-gateway';
import CronJobs from '@/pages/cron-jobs';
import LifeLanding from '@/pages/life/landing';
import LifeTravelList from '@/pages/life/travel-list';
import LifeTravelDetail from '@/pages/life/travel-detail';
import LifeRentalList from '@/pages/life/rental-list';
import LifeRentalDetail from '@/pages/life/rental-detail';
import LifeAccommodationList from '@/pages/life/accommodation-list';
import LifeAccommodationDetail from '@/pages/life/accommodation-detail';

function PlanDetailRedirect() {
  const { planId } = useParams();
  return <Navigate to={`/knowledge/review/plans/${planId}`} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="system" element={<SystemDashboard />} />
        <Route path="msg-gateway" element={<MsgGateway />} />
        <Route path="cron-jobs" element={<CronJobs />} />
        <Route path="services" element={<ServiceCatalog />} />
        <Route path="efficiency" element={<EfficiencyEvaluator />} />
        <Route path="data-sources" element={<DataSources />} />

        {/* Docs — tabs: 文档 / 变更时间线 / K8s配置 */}
        <Route path="docs" element={<DocsLayout />}>
          <Route index element={<DocsPage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="argo-config" element={<ArgoConfigPage />} />
        </Route>

        <Route path="homework" element={<HomeworkPage />} />
        <Route path="homework/chinese" element={<ChinesePage />} />
        <Route path="homework/math" element={<MathPage />} />
        <Route path="homework/english" element={<EnglishPage />} />
        <Route path="homework/grading" element={<GradingPage />} />
        <Route path="wordbook" element={<WordbookPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />

        {/* Knowledge Review — tabs rendered inline by each page */}
        <Route path="knowledge/review" element={<KnowledgeReviewPage />} />
        <Route path="knowledge/review/plans" element={<KnowledgePlansPage />} />
        <Route path="knowledge/review/plans/:planId" element={<KnowledgePlanDetailPage />} />

        {/* Members — tabs: 家庭成员 / 表单填充 */}
        <Route path="members" element={<MembersLayout />}>
          <Route index element={<MemberList />} />
          <Route path="form-filling" element={<FormFilling />} />
        </Route>
        <Route path="members/:id" element={<MemberDetail />} />

        {/* Redirects for old routes */}
        <Route path="documents" element={<Navigate to="/members" replace />} />
        <Route path="addresses" element={<Navigate to="/members" replace />} />
        <Route path="bank-accounts" element={<Navigate to="/members" replace />} />
        <Route path="ai-news" element={<Navigate to="/dashboard" replace />} />
        <Route path="timeline" element={<Navigate to="/docs/timeline" replace />} />
        <Route path="argo-config" element={<Navigate to="/docs/argo-config" replace />} />
        <Route path="form-filling" element={<Navigate to="/members/form-filling" replace />} />
        <Route path="knowledge/plans" element={<Navigate to="/knowledge/review/plans" replace />} />
        <Route path="knowledge/plans/:planId" element={<PlanDetailRedirect />} />

        {/* Game Development — landing + sub-modules */}
        <Route path="game-dev" element={<GameDevLanding />} />
        <Route path="game-dev/skills" element={<GameDevLayout />}>
          <Route index element={<Navigate to="/game-dev/skills/workbench" replace />} />
          <Route path="workbench" element={<GameDevWorkbench />} />
          <Route path="atoms" element={<GameDevAtoms />} />
          <Route path="originals" element={<GameDevOriginals />} />
          <Route path="modifiers" element={<GameDevModifiers />} />
          <Route path="rules" element={<GameDevRules />} />
        </Route>
        <Route path="game-dev/framework" element={<GameDevWorkshop />} />
        <Route path="game-dev/framework/:projectId" element={<GameDevWorkshopDetail />} />
        <Route path="game-dev/art-2d" element={<GameDevArt2DLayout />}>
          <Route index element={<Navigate to="/game-dev/art-2d/generator" replace />} />
          <Route path="generator" element={<GameDevArt2DGenerator />} />
          <Route path="history" element={<GameDevArt2DHistory />} />
        </Route>

        {/* Life App — landing + sub-modules */}
        <Route path="life" element={<LifeLanding />} />
        <Route path="life/travel" element={<LifeTravelList />} />
        <Route path="life/travel/:planId" element={<LifeTravelDetail />} />
        <Route path="life/rental" element={<LifeRentalList />} />
        <Route path="life/rental/:propertyId" element={<LifeRentalDetail />} />
        <Route path="life/accommodation" element={<LifeAccommodationList />} />
        <Route path="life/accommodation/:id" element={<LifeAccommodationDetail />} />

        <Route path="machines" element={<MachinesPage />} />
        <Route path="files" element={<Files />} />
        <Route path="finance" element={<Finance />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
