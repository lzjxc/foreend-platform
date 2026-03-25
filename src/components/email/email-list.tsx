import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Search, ChevronLeft, ChevronRight, X, CalendarDays, PenSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useEmailList, useDraftList } from '@/hooks/use-emails';
import type { EmailListItem, EmailListFilters } from '@/types/email';

const DIRECTIONS = [
  { label: '全部', value: undefined },
  { label: '收件', value: 'inbound' as const },
  { label: '发件', value: 'outbound' as const },
  { label: '草稿', value: 'draft' as const },
];

const REPLY_STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft_pending: { label: '草稿待确认', className: 'border-amber-500 text-amber-500' },
  confirmed: { label: '已确认', className: 'border-blue-500 text-blue-500' },
  sent: { label: '已回复', className: 'border-green-500 text-green-500' },
};

interface EmailListProps {
  selectedId: string | null;
  onSelect: (email: EmailListItem) => void;
  onCompose: () => void;
  onSelectDraft: (id: string) => void;
  dateFilter?: string;
  onClearDateFilter?: () => void;
}

export function EmailList({ selectedId, onSelect, onCompose, onSelectDraft, dateFilter, onClearDateFilter }: EmailListProps) {
  const [filters, setFilters] = useState<EmailListFilters>({ page: 1, size: 20 });
  const [searchInput, setSearchInput] = useState('');

  const isDraftMode = filters.direction === 'draft';

  // Strip 'draft' from filters before passing to useEmailList (backend doesn't support direction=draft on /emails)
  const emailFilters = isDraftMode ? { ...filters, direction: undefined } : filters;

  // Apply external date filter from chart click
  // date_to needs to be next day because backend uses <= comparison on datetime
  useEffect(() => {
    if (dateFilter) {
      const nextDay = new Date(dateFilter);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      setFilters((f) => ({ ...f, date_from: dateFilter, date_to: nextDayStr, page: 1 }));
    } else {
      setFilters((f) => ({ ...f, date_from: undefined, date_to: undefined, page: 1 }));
    }
  }, [dateFilter]);

  // Both hooks always called (React rules), but only one result is used
  const emailQuery = useEmailList(emailFilters);
  const draftQuery = useDraftList(filters.page || 1, filters.size || 20);

  const data = isDraftMode ? draftQuery.data : emailQuery.data;
  const isLoading = isDraftMode ? draftQuery.isLoading : emailQuery.isLoading;

  const handleSearch = useCallback(() => {
    setFilters((f) => ({ ...f, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const totalPages = data ? Math.ceil(data.total / (filters.size || 20)) : 0;

  return (
    <div className="flex h-full flex-col">
      {/* Filter bar */}
      <div className="space-y-2 border-b p-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {DIRECTIONS.map((d) => (
              <Button
                key={d.label}
                variant={filters.direction === d.value ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilters((f) => ({ ...f, direction: d.value, page: 1 }))}
              >
                {d.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={filters.important ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilters((f) => ({ ...f, important: f.important ? undefined : true, page: 1 }))}
            >
              <Star className="mr-1 h-3 w-3" />
              仅重要
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={onCompose}
            >
              <PenSquare className="mr-1 h-3 w-3" />
              写邮件
            </Button>
          </div>
        </div>
        <div className="flex gap-1">
          <Input
            placeholder="搜索主题或发件人..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-8 text-xs"
          />
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {dateFilter && (
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="gap-1 text-xs">
              <CalendarDays className="h-3 w-3" />
              {dateFilter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onClearDateFilter?.()}
              />
            </Badge>
          </div>
        )}
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="p-4 text-center text-sm text-muted-foreground">加载中...</p>
        ) : !data?.items.length ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            {isDraftMode ? '暂无草稿' : '暂无邮件'}
          </p>
        ) : (
          data.items.map((email) => {
            const isDraft = email.direction === 'draft';
            return (
              <div
                key={email.id}
                onClick={() => isDraft ? onSelectDraft(email.id) : onSelect(email)}
                className={cn(
                  'cursor-pointer border-b p-3 transition-colors hover:bg-accent/50',
                  selectedId === email.id && 'bg-accent',
                  !email.is_read && !isDraft && 'bg-accent/20',
                  isDraft && 'border-l-[3px] border-l-amber-500 bg-amber-500/5',
                )}
              >
                <div className="flex items-start gap-2">
                  {!isDraft && (
                    <Star
                      className={cn(
                        'mt-0.5 h-4 w-4 flex-shrink-0',
                        email.is_important ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30',
                      )}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        {isDraft && (
                          <Badge variant="outline" className="flex-shrink-0 border-amber-500/50 bg-amber-500/10 text-xs text-amber-500">
                            草稿
                          </Badge>
                        )}
                        <span className={cn('truncate text-sm', !email.is_read && !isDraft && 'font-semibold')}>
                          {email.from_name || email.from_address}
                        </span>
                      </div>
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(email.email_date), { addSuffix: true, locale: zhCN })}
                      </span>
                    </div>
                    <p className={cn('truncate text-sm', !email.is_read && !isDraft ? 'text-foreground' : 'text-muted-foreground')}>
                      {email.subject || '(无主题)'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {email.body_preview}
                    </p>
                    {!isDraft && email.reply_status !== 'none' && REPLY_STATUS_MAP[email.reply_status] && (
                      <Badge variant="outline" className={cn('mt-1 text-xs', REPLY_STATUS_MAP[email.reply_status].className)}>
                        {REPLY_STATUS_MAP[email.reply_status].label}
                      </Badge>
                    )}
                  </div>
                  {!isDraft && !email.is_read && (
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-3 py-2">
          <span className="text-xs text-muted-foreground">
            {data?.total ?? 0} {isDraftMode ? '封草稿' : '封邮件'}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={(filters.page || 1) <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">
              {filters.page || 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={(filters.page || 1) >= totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
