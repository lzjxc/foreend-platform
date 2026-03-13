import { designImageClient } from './client';
import type { GenerateRequest, GenerateResponse, HistoryListResponse, PresetItem, ImageGenerateRequest, ImageGenerateResponse } from '@/types/design-image';

export async function generatePrompt(req: GenerateRequest) {
  const { data } = await designImageClient.post<GenerateResponse>('/api/v1/generate', req);
  return data;
}

export async function getHistory(params?: {
  page?: number;
  limit?: number;
  content_type?: string;
  art_style?: string;
  target_tool?: string;
}) {
  const { data } = await designImageClient.get<HistoryListResponse>('/api/v1/history', { params });
  return data;
}

export async function deleteHistory(id: string) {
  const { data } = await designImageClient.delete(`/api/v1/history/${id}`);
  return data;
}

export async function getPresets() {
  const { data } = await designImageClient.get<PresetItem[]>('/api/v1/presets');
  return data;
}

/** Build SSE URL for streaming generation */
export function buildStreamUrl(req: GenerateRequest): string {
  const ctx = req.project_context;
  const params = new URLSearchParams({
    game_genre: ctx.game_genre,
    content_type: req.content_type,
    art_style: req.art_style,
    target_tool: req.target_tool,
    params: JSON.stringify(req.params),
  });
  if (ctx.project_name) params.set('project_name', ctx.project_name);
  if (ctx.sub_genre) params.set('sub_genre', ctx.sub_genre);
  if (ctx.platform) params.set('platform', ctx.platform);
  if (ctx.art_direction_notes) params.set('art_direction_notes', ctx.art_direction_notes);

  return `/design-image-api/api/v1/generate/stream?${params.toString()}`;
}

export async function generateImage(req: ImageGenerateRequest): Promise<ImageGenerateResponse> {
  const { data } = await designImageClient.post<ImageGenerateResponse>('/api/v1/generate-image', req);
  return data;
}
