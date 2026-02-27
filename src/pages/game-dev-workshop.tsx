import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Boxes, Clock } from 'lucide-react';
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/use-game-workshop';
import { PHASE_MAP } from '@/types/game-workshop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function GameDevWorkshop() {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project = await createProject.mutateAsync({ name: name.trim(), description: description.trim() });
    setShowCreate(false);
    setName('');
    setDescription('');
    navigate(`/game-dev/framework/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定删除该项目？所有设计记录将一并删除。')) {
      deleteProject.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/game-dev')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Boxes className="h-6 w-6 text-blue-500" />
          <div>
            <h1 className="text-xl font-bold">框架设计工坊</h1>
            <p className="text-sm text-muted-foreground">AI 辅助的游戏系统设计</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          新建项目
        </button>
      </div>

      {/* Project grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border bg-muted/50" />
          ))}
        </div>
      ) : !projects?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Boxes className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-medium text-muted-foreground">还没有设计项目</h3>
          <p className="mt-1 text-sm text-muted-foreground/70">
            点击「新建项目」开始你的游戏系统设计
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const phase = PHASE_MAP[p.current_phase as keyof typeof PHASE_MAP];
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/game-dev/framework/${p.id}`)}
                className="group relative rounded-xl border bg-card p-5 text-left transition-all hover:shadow-md hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  <button
                    onClick={(e) => handleDelete(e, p.id)}
                    className="rounded p-1 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {p.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  {phase && (
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-600">
                      {phase.label}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(p.updated_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建设计项目</DialogTitle>
            <DialogDescription>输入项目名称和简要描述，开始你的游戏系统设计。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">项目名称</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：Roguelike 卡牌构筑"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">项目描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述你的游戏创意..."
                rows={3}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || createProject.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createProject.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
