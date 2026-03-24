import { useState } from 'react';
import { EmailList } from './email-list';
import { EmailDetail } from './email-detail';
import type { EmailListItem } from '@/types/email';

interface EmailInboxProps {
  dateFilter?: string;
  onClearDateFilter?: () => void;
}

export function EmailInbox({ dateFilter, onClearDateFilter }: EmailInboxProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    // 220px = header(64) + page padding(48) + tabs bar(40) + tab content margin(16) + settings bar(52)
    <div className="flex h-[calc(100vh-220px)] gap-0 overflow-hidden rounded-lg border">
      {/* Left panel: email list */}
      <div className="w-[40%] border-r">
        <EmailList
          selectedId={selectedId}
          onSelect={(email: EmailListItem) => setSelectedId(email.id)}
          dateFilter={dateFilter}
          onClearDateFilter={onClearDateFilter}
        />
      </div>
      {/* Right panel: email detail */}
      <div className="w-[60%]">
        <EmailDetail emailId={selectedId} />
      </div>
    </div>
  );
}
