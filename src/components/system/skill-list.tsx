import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  RefreshCw,
  Zap,
  Tag,
  Clock,
  Hash,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSkills, skillKeys } from '@/hooks/use-skills';
import type { Skill, SkillSource, SkillStatus, SkillFilters } from '@/types/skill';
import { SKILL_SOURCE_CONFIG, SKILL_STATUS_CONFIG } from '@/types/skill';
import { SkillDetailDialog } from './skill-detail-dialog';

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 30) return `${diffDays} 天前`;
  return date.toLocaleDateString('zh-CN');
}

interface SkillCardProps {
  skill: Skill;
  onClick: () => void;
}

function SkillCard({ skill, onClick }: SkillCardProps) {
  const sourceConfig = SKILL_SOURCE_CONFIG[skill.source];
  const statusConfig = SKILL_STATUS_CONFIG[skill.status];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
            {skill.name}
          </CardTitle>
          <Badge className={`shrink-0 text-[10px] ${statusConfig.color}`}>
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {skill.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {skill.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-[10px] ${sourceConfig.color}`}>
            {sourceConfig.label}
          </Badge>
          {skill.category && (
            <Badge variant="outline" className="text-[10px]">
              {skill.category}
            </Badge>
          )}
        </div>

        {skill.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
            {skill.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] text-muted-foreground">
                {tag}
              </span>
            ))}
            {skill.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{skill.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            v{skill.version}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(skill.updated_at || skill.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function SkillList() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Build filters for the API query
  const filters: SkillFilters = useMemo(() => {
    const f: SkillFilters = {};
    if (searchQuery.trim()) f.q = searchQuery.trim();
    if (sourceFilter !== 'all') f.source = sourceFilter as SkillSource;
    if (statusFilter !== 'all') f.status = statusFilter as SkillStatus;
    return f;
  }, [searchQuery, sourceFilter, statusFilter]);

  const { data, isLoading, isFetching } = useSkills(filters);

  const skills = data?.skills ?? [];
  const total = data?.total ?? 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索 Skill 名称或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="来源" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部来源</SelectItem>
              <SelectItem value="user-command">用户命令</SelectItem>
              <SelectItem value="user-skill">用户技能</SelectItem>
              <SelectItem value="plugin-skill">插件技能</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[110px] h-9">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">活跃</SelectItem>
              <SelectItem value="deprecated">已弃用</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Zap className="h-4 w-4" />
        <span>共 {total} 个 Skill</span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              {searchQuery || sourceFilter !== 'all' || statusFilter !== 'all'
                ? '没有找到匹配的 Skill'
                : '暂无 Skill 数据'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onClick={() => {
                setSelectedSkill(skill);
                setDetailOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <SkillDetailDialog
        skill={selectedSkill}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
