import { useState } from 'react';
import { EmailList } from './email-list';
import { EmailDetail } from './email-detail';
import { EmailCompose } from './email-compose';
import type { EmailListItem } from '@/types/email';

type RightPanelMode = 'view' | 'compose' | 'edit-draft';

interface EmailInboxProps {
  dateFilter?: string;
  onClearDateFilter?: () => void;
}

export function EmailInbox({ dateFilter, onClearDateFilter }: EmailInboxProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<RightPanelMode>('view');
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  const handleSelect = (email: EmailListItem) => {
    setSelectedId(email.id);
    setPanelMode('view');
  };

  const handleCompose = () => {
    setPanelMode('compose');
    setEditingDraftId(null);
  };

  const handleSelectDraft = (id: string) => {
    setEditingDraftId(id);
    setPanelMode('edit-draft');
  };

  const handleCloseCompose = () => {
    setPanelMode('view');
    setEditingDraftId(null);
  };

  return (
    <div className="flex h-[calc(100vh-220px)] gap-0 overflow-hidden rounded-lg border">
      {/* Left panel: email list */}
      <div className="w-[40%] border-r">
        <EmailList
          selectedId={panelMode === 'view' ? selectedId : null}
          onSelect={handleSelect}
          onCompose={handleCompose}
          onSelectDraft={handleSelectDraft}
          dateFilter={dateFilter}
          onClearDateFilter={onClearDateFilter}
        />
      </div>
      {/* Right panel: detail or compose */}
      <div className="w-[60%]">
        {panelMode === 'view' && (
          <EmailDetail emailId={selectedId} />
        )}
        {panelMode === 'compose' && (
          <EmailCompose onClose={handleCloseCompose} />
        )}
        {panelMode === 'edit-draft' && editingDraftId && (
          <EmailCompose draftId={editingDraftId} onClose={handleCloseCompose} />
        )}
      </div>
    </div>
  );
}
