import { Outlet } from 'react-router-dom';
import { Users, FileInput } from 'lucide-react';
import { PageTabs } from '@/components/ui/page-tabs';

const tabs = [
  { path: '/members', label: '家庭成员', icon: Users, end: true },
  { path: '/members/form-filling', label: '表单填充', icon: FileInput },
];

export default function MembersLayout() {
  return (
    <div>
      <PageTabs tabs={tabs} />
      <Outlet />
    </div>
  );
}
