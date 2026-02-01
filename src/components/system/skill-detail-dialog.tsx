import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Tag,
  Hash,
  Clock,
  FolderOpen,
  History,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSkillVersions } from '@/hooks/use-skills';
import type { Skill, SkillVersion } from '@/types/skill';
import { SKILL_SOURCE_CONFIG, SKILL_STATUS_CONFIG } from '@/types/skill';

interface SkillDetailDialogProps {
  skill: Skill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VersionItem({
  version,
  isExpanded,
  onToggle,
}: {
  version: SkillVersion;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-3 text-sm hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Badge variant="outline" className="text-[10px]">
            v{version.version}
          </Badge>
          {version.change_summary && (
            <span className="text-muted-foreground truncate max-w-[300px]">
              {version.change_summary}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(version.created_at).toLocaleDateString('zh-CN')}
        </span>
      </button>
      {isExpanded && (
        <div className="border-t p-3">
          <div className="prose prose-sm dark:prose-invert max-w-none max-h-64 overflow-y-auto">
            <ReactMarkdown>{version.content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export function SkillDetailDialog({
  skill,
  open,
  onOpenChange,
}: SkillDetailDialogProps) {
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  const { data: versions, isLoading: versionsLoading } = useSkillVersions(
    skill?.id || ''
  );

  if (!skill) return null;

  const sourceConfig = SKILL_SOURCE_CONFIG[skill.source];
  const statusConfig = SKILL_STATUS_CONFIG[skill.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {skill.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={sourceConfig.color}>{sourceConfig.label}</Badge>
            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
            <Badge variant="outline" className="gap-1">
              <Hash className="h-3 w-3" />
              v{skill.version}
            </Badge>
            {skill.category && (
              <Badge variant="secondary">{skill.category}</Badge>
            )}
          </div>

          {/* ID and description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">ID:</span>
              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                {skill.id}
              </code>
            </div>
            {skill.description && (
              <p className="text-sm text-muted-foreground">
                {skill.description}
              </p>
            )}
          </div>

          {/* Tags */}
          {skill.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {skill.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* File path and plugin info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {skill.file_path && (
              <div className="flex items-start gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs">文件路径</p>
                  <code className="text-xs break-all">{skill.file_path}</code>
                </div>
              </div>
            )}
            {skill.plugin_name && (
              <div>
                <p className="text-muted-foreground text-xs">插件</p>
                <p className="text-sm">
                  {skill.plugin_name}
                  {skill.plugin_version && ` (${skill.plugin_version})`}
                </p>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">创建时间</p>
                <p className="text-sm">
                  {new Date(skill.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
            {skill.updated_at && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs">更新时间</p>
                  <p className="text-sm">
                    {new Date(skill.updated_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Content preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              内容预览
            </h4>
            <div className="border rounded-lg p-4 max-h-80 overflow-y-auto bg-muted/30">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{skill.content}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Version History */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              版本历史
            </h4>
            {versionsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : !versions || versions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                暂无历史版本
              </p>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <VersionItem
                    key={version.id}
                    version={version}
                    isExpanded={expandedVersion === version.id}
                    onToggle={() =>
                      setExpandedVersion(
                        expandedVersion === version.id ? null : version.id
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Frontmatter (if any) */}
          {skill.frontmatter && Object.keys(skill.frontmatter).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Frontmatter</h4>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                {JSON.stringify(skill.frontmatter, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
