import { useState, useEffect } from 'react';
import { BookOpen, User } from 'lucide-react';
import { useWordbookStats } from '@/hooks/use-wordbook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StatsCard,
  WordSearch,
  WordList,
  ReviewSession,
  WordCardDetail,
} from '@/components/wordbook';

// 预设用户列表 (dingtalk_user_id)
const PRESET_USERS = [
  { id: 'default', label: '默认用户' },
  { id: '2663293269397558311', label: '钉钉用户' },
];

const CUSTOM_USER_VALUE = '__custom__';

// 从 localStorage 获取保存的用户
function getSavedUserId(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('wordbook-user-id') || 'default';
  }
  return 'default';
}

export default function WordbookPage() {
  const [userId, setUserId] = useState<string>(getSavedUserId);
  const [customUserId, setCustomUserId] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

  // 保存用户选择到 localStorage
  useEffect(() => {
    localStorage.setItem('wordbook-user-id', userId);
  }, [userId]);

  const { data: stats, isLoading: isStatsLoading } = useWordbookStats(userId);

  const handleCustomUserSubmit = () => {
    if (customUserId.trim()) {
      setUserId(customUserId.trim());
      setShowCustomInput(false);
      setCustomUserId('');
    }
  };

  const currentUserLabel = PRESET_USERS.find(u => u.id === userId)?.label || `用户: ${userId}`;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">单词本</h1>
            <p className="text-sm text-muted-foreground">
              使用间隔重复学习单词
            </p>
          </div>
        </div>

        {/* User Switcher */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          {showCustomInput ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="输入用户 ID"
                value={customUserId}
                onChange={(e) => setCustomUserId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomUserSubmit()}
                className="w-40 h-9"
                autoFocus
              />
              <Button size="sm" onClick={handleCustomUserSubmit}>
                确定
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCustomInput(false)}>
                取消
              </Button>
            </div>
          ) : (
            <Select
              value={PRESET_USERS.find(u => u.id === userId) ? userId : CUSTOM_USER_VALUE}
              onValueChange={(value) => {
                if (value === CUSTOM_USER_VALUE) {
                  setShowCustomInput(true);
                } else {
                  setUserId(value);
                }
              }}
            >
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="选择用户">
                  {currentUserLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PRESET_USERS.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.label}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={CUSTOM_USER_VALUE}>
                  自定义用户 ID...
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsCard stats={stats} isLoading={isStatsLoading} />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Review session */}
          <ReviewSession userId={userId} />

          {/* Word search */}
          <WordSearch userId={userId} />
        </div>

        {/* Right column */}
        <div>
          {/* Word list */}
          <WordList
            userId={userId}
            onWordSelect={(wordId) => setSelectedWordId(wordId)}
          />
        </div>
      </div>

      {/* Word detail dialog */}
      <WordCardDetail
        wordId={selectedWordId}
        userId={userId}
        onClose={() => setSelectedWordId(null)}
      />
    </div>
  );
}
