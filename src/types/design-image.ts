export type GameGenre = 'rpg' | 'moba' | 'fps' | 'strategy' | 'card' | 'platformer' | 'casual' | 'puzzle' | 'horror' | 'sports' | 'simulation' | 'other';
export type ContentType = 'monster' | 'character' | 'scene' | 'item' | 'skill' | 'comic' | 'ui' | 'vehicle' | 'building' | 'vfx';
export type ArtStyle = 'pixel64' | 'pixel16' | 'manga' | 'manhwa' | 'darkfantasy' | 'chibi' | 'inkwash' | 'concept';
export type TargetTool = 'midjourney' | 'stablediffusion' | 'dalle3' | 'leonardo' | 'comfyui';

export interface ProjectContext {
  project_name?: string;
  game_genre: GameGenre;
  sub_genre?: string;
  platform?: string;
  art_direction_notes?: string;
}

export interface GenerateRequest {
  project_context: ProjectContext;
  content_type: ContentType;
  art_style: ArtStyle;
  target_tool: TargetTool;
  params: Record<string, unknown>;
}

export interface GenerateMetadata {
  content_type: string;
  art_style: string;
  target_tool: string;
  tokens_used: number;
  created_at: string;
}

export interface GenerateResponse {
  id: string;
  prompt: string;
  negative_prompt?: string;
  tool_suffix: string;
  full_prompt: string;
  metadata: GenerateMetadata;
}

export interface HistoryItem {
  id: string;
  project_name?: string;
  game_genre: string;
  content_type: string;
  art_style: string;
  target_tool: string;
  params: Record<string, unknown>;
  prompt: string;
  negative_prompt?: string;
  tool_suffix?: string;
  full_prompt: string;
  tokens_used: number;
  rating?: number;
  exported: boolean;
  created_at: string;
}

export interface HistoryListResponse {
  items: HistoryItem[];
  total: number;
  page: number;
}

export interface PresetItem {
  id: string;
  name: string;
  project_context: ProjectContext;
  content_type: ContentType;
  art_style: ArtStyle;
  params: Record<string, unknown>;
}

// Labels for UI display
export const GAME_GENRE_LABELS: Record<GameGenre, string> = {
  rpg: 'RPG', moba: 'MOBA', fps: 'FPS', strategy: '策略', card: '卡牌',
  platformer: '平台跳跃', casual: '休闲', puzzle: '解谜', horror: '恐怖',
  sports: '体育', simulation: '模拟', other: '其他',
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  monster: '怪物', character: '角色', scene: '场景', item: '道具',
  skill: '技能图标', comic: '漫画分镜', ui: 'UI元素',
  vehicle: '载具', building: '建筑', vfx: '特效',
};

export const ART_STYLE_LABELS: Record<ArtStyle, string> = {
  pixel64: '像素 64px', pixel16: '像素 16px', manga: '漫画', manhwa: '韩漫',
  darkfantasy: '暗黑奇幻', chibi: 'Q版', inkwash: '水墨', concept: '概念原画',
};

export const TARGET_TOOL_LABELS: Record<TargetTool, string> = {
  midjourney: 'Midjourney', stablediffusion: 'Stable Diffusion', dalle3: 'DALL-E 3',
  leonardo: 'Leonardo', comfyui: 'ComfyUI',
};

// Image generation types
export interface ImageGenerateRequest {
  project_context: ProjectContext;
  content_type: ContentType;
  art_style: ArtStyle;
  params: Record<string, unknown>;
  width?: number;
  height?: number;
}

export interface ImageGenerateMetadata {
  content_type: string;
  art_style: string;
  tokens_used: number;
  exec_time_ms: number;
  created_at: string;
}

export interface ImageGenerateResponse {
  id: string;
  image_base64: string;
  code: string;
  width: number;
  height: number;
  metadata: ImageGenerateMetadata;
}
