import { useNavigate } from 'react-router-dom';
import { Swords, Boxes, Users, BookOpen, Image, Box, ArrowRight } from 'lucide-react';
import { useDesignStats } from '@/hooks/use-game-design';

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  ready: boolean;
  stats?: { label: string; value: number }[];
}

export default function GameDevLanding() {
  const navigate = useNavigate();
  const { data: stats } = useDesignStats();

  const modules: ModuleCard[] = [
    {
      id: 'skills',
      title: '技能设计',
      description: '原子化技能设计系统。定义基础原子、组装参考技能、实例化调参，支持修饰器和规则约束。',
      icon: Swords,
      path: '/game-dev/skills',
      color: 'from-violet-500/20 to-violet-600/5 border-violet-500/30',
      ready: true,
      stats: stats
        ? [
            { label: '原子', value: stats.atoms },
            { label: '参考技能', value: stats.original_skills },
            { label: '技能实例', value: stats.skill_instances },
            { label: '修饰器', value: stats.modifiers },
          ]
        : undefined,
    },
    {
      id: 'framework',
      title: '框架设计',
      description: 'AI 辅助的游戏系统设计工具。通过概念探索、系统蓝图、数值框架等阶段，完成从创意到 GDD 的设计流程。',
      icon: Boxes,
      path: '/game-dev/framework',
      color: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
      ready: true,
    },
    {
      id: 'characters',
      title: '角色设计',
      description: '角色与职业体系设计。定义角色属性、职业技能树、成长曲线、装备系统。',
      icon: Users,
      path: '/game-dev/characters',
      color: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
      ready: false,
    },
    {
      id: 'story',
      title: '剧情设计',
      description: '剧情与叙事设计工具。编排主线/支线剧情、对话树、事件触发器、多结局分支。',
      icon: BookOpen,
      path: '/game-dev/story',
      color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
      ready: false,
    },
    {
      id: 'art-2d',
      title: '2D 图片设计',
      description: 'AI 驱动的 2D 美术资源生成与管理。角色立绘、场景原画、UI 素材、图标设计与风格迭代。',
      icon: Image,
      path: '/game-dev/art-2d',
      color: 'from-pink-500/20 to-pink-600/5 border-pink-500/30',
      ready: false,
    },
    {
      id: 'model-3d',
      title: '3D 模型设计',
      description: 'AI 辅助的 3D 建模工作流。角色模型、场景资产、道具武器生成，支持风格参考与批量迭代。',
      icon: Box,
      path: '/game-dev/model-3d',
      color: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30',
      ready: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">游戏开发</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          选择一个设计模块开始工作
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => mod.ready && navigate(mod.path)}
            disabled={!mod.ready}
            className={`group relative rounded-xl border bg-gradient-to-br p-5 text-left transition-all ${mod.color} ${
              mod.ready
                ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]'
                : 'cursor-not-allowed opacity-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <mod.icon className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">{mod.title}</h3>
                  {!mod.ready && (
                    <span className="text-[11px] text-muted-foreground">即将推出</span>
                  )}
                </div>
              </div>
              {mod.ready && (
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </div>

            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {mod.description}
            </p>

            {mod.stats && (
              <div className="mt-4 flex gap-4">
                {mod.stats.map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-lg font-bold">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
