import { Outlet } from 'react-router-dom';
import { FileText, History, Settings2 } from 'lucide-react';
import { PageTabs } from '@/components/ui/page-tabs';

const tabs = [
  { path: '/docs', label: '文档', icon: FileText, end: true },
  { path: '/docs/timeline', label: '变更时间线', icon: History },
  { path: '/docs/argo-config', label: 'K8s配置', icon: Settings2 },
];

export default function DocsLayout() {
  return (
    <div>
      <PageTabs tabs={tabs} />
      <Outlet />
    </div>
  );
}
