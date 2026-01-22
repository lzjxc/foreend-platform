import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wordbookClient } from '@/api/client';
import type {
  UserId,
  SearchResult,
  AddWordResult,
  WordCard,
  FindWordsResult,
  ListWordsResult,
  TodayReviewResult,
  StartReviewResult,
  GradeResult,
  WordbookStats,
  SearchWordRequest,
  AddWordRequest,
  ListType,
  WordItem,
} from '@/types/wordbook';

// Default user ID for single-user mode
const DEFAULT_USER_ID = 'default';

// Query keys
export const wordbookKeys = {
  all: ['wordbook'] as const,
  stats: (userId: UserId) => [...wordbookKeys.all, 'stats', userId] as const,
  list: (userId: UserId, listType: ListType) => [...wordbookKeys.all, 'list', userId, listType] as const,
  find: (userId: UserId, keyword: string) => [...wordbookKeys.all, 'find', userId, keyword] as const,
  word: (userId: UserId, wordId: string) => [...wordbookKeys.all, 'word', userId, wordId] as const,
  todayReview: (userId: UserId) => [...wordbookKeys.all, 'todayReview', userId] as const,
};

// API 实际响应格式（聊天机器人格式）
interface TextApiResponse {
  type?: string;
  content?: string;
}

// 解析列表响应文本，提取单词列表
// 格式: "📋 最近新增 (1 词)：\n\n[30] warfare - 战争，战斗"
function parseWordListContent(content: string): WordItem[] {
  const words: WordItem[] = [];
  // 匹配 [id] word - meaning 格式
  const regex = /\[(\d+)\]\s+(\S+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    words.push({
      word_id: match[1],
      term: match[2],
    });
  }
  return words;
}

// 解析列表头部中的总数
// 格式: "📋 最近新增 (1 词)：" 或 "📋 词库列表 (50 词)："
function parseWordListTotalCount(content: string): number {
  const countMatch = content.match(/\((\d+)\s*词\)/);
  return countMatch ? parseInt(countMatch[1], 10) : 0;
}

// 解析待复习数量
// 格式: "📚 今日待复习: 5 词" 或 "🎉 今日复习完成！"
function parseTodayReviewContent(content: string): { due_count: number; words: WordItem[] } {
  const countMatch = content.match(/待复习[:：]\s*(\d+)/);
  const due_count = countMatch ? parseInt(countMatch[1], 10) : 0;
  const words = parseWordListContent(content);
  return { due_count, words };
}

// 搜索单词（不入库）
export function useSearchWord() {
  return useMutation({
    mutationFn: async (request: SearchWordRequest): Promise<SearchResult> => {
      const { data } = await wordbookClient.post<TextApiResponse>(
        '/internal/v1/words/search',
        {
          user_id: request.user_id || DEFAULT_USER_ID,
          term: request.term,
          mode: request.mode || 'full',
        }
      );
      // API 返回 {type: "text", content: "..."} 格式
      const content = data.content || '';
      // 检查是否找到单词（包含音标或释义则认为找到）
      const found = content.includes('//') || content.includes('中文:') || content.includes('[noun]') || content.includes('[verb]') || content.includes('[adj]');
      return {
        card: content,
        found,
      };
    },
  });
}

// 添加单词到词库
export function useAddWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: AddWordRequest): Promise<AddWordResult> => {
      const { data } = await wordbookClient.post<TextApiResponse>(
        '/internal/v1/words/add',
        {
          user_id: request.user_id || DEFAULT_USER_ID,
          term: request.term,
        }
      );
      const content = data.content || '';
      // 解析响应，检查是否添加成功
      // 成功: "✅ 已添加 'word' (ID: 30)"
      // 已存在: "❌ 单词 'word' 已存在 (ID: 30)"
      const idMatch = content.match(/ID[:：]\s*(\d+)/);
      const added = content.includes('✅') || content.includes('已添加');
      return {
        card: content,
        word_id: idMatch ? idMatch[1] : '',
        added,
      };
    },
    onSuccess: (_, variables) => {
      const userId = variables.user_id || DEFAULT_USER_ID;
      queryClient.invalidateQueries({ queryKey: wordbookKeys.stats(userId) });
      queryClient.invalidateQueries({ queryKey: wordbookKeys.list(userId, 'new') });
      queryClient.invalidateQueries({ queryKey: wordbookKeys.list(userId, 'recent') });
    },
  });
}

// 查看词卡详情
export function useWordCard(wordId: string, userId: UserId = DEFAULT_USER_ID) {
  return useQuery({
    queryKey: wordbookKeys.word(userId, wordId),
    queryFn: async (): Promise<WordCard> => {
      const { data } = await wordbookClient.get<TextApiResponse>(
        `/internal/v1/words/show/${wordId}`,
        { params: { user_id: userId } }
      );
      return {
        card: data.content || '',
        word_id: wordId,
      };
    },
    enabled: !!wordId,
  });
}

// 模糊搜索词库
export function useFindWords(keyword: string, userId: UserId = DEFAULT_USER_ID, limit: number = 10) {
  return useQuery({
    queryKey: wordbookKeys.find(userId, keyword),
    queryFn: async (): Promise<FindWordsResult> => {
      const { data } = await wordbookClient.post<TextApiResponse>(
        '/internal/v1/words/find',
        {
          user_id: userId,
          keyword,
          limit,
        }
      );
      const words = parseWordListContent(data.content || '');
      return { words };
    },
    enabled: keyword.length >= 2,
  });
}

// 列表查询
export function useWordList(listType: ListType, userId: UserId = DEFAULT_USER_ID, limit: number = 20) {
  return useQuery({
    queryKey: wordbookKeys.list(userId, listType),
    queryFn: async (): Promise<ListWordsResult> => {
      const { data } = await wordbookClient.post<TextApiResponse>(
        '/internal/v1/words/list',
        {
          user_id: userId,
          list_type: listType,
          limit,
        }
      );
      const words = parseWordListContent(data.content || '');
      return { words };
    },
  });
}

// 删除单词
export function useDeleteWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wordId, userId }: { wordId: string; userId?: UserId }) => {
      await wordbookClient.delete(`/internal/v1/words/${wordId}`, {
        params: { user_id: userId || DEFAULT_USER_ID },
      });
    },
    onSuccess: (_, variables) => {
      const userId = variables.userId || DEFAULT_USER_ID;
      queryClient.invalidateQueries({ queryKey: wordbookKeys.stats(userId) });
      queryClient.invalidateQueries({ queryKey: [...wordbookKeys.all, 'list'] });
    },
  });
}

// 获取今日待复习
export function useTodayReview(userId: UserId = DEFAULT_USER_ID) {
  return useQuery({
    queryKey: wordbookKeys.todayReview(userId),
    queryFn: async (): Promise<TodayReviewResult> => {
      const { data } = await wordbookClient.post<TextApiResponse>(
        '/internal/v1/review/today',
        { user_id: userId }
      );
      return parseTodayReviewContent(data.content || '');
    },
  });
}

// 开始复习
export function useStartReview() {
  return useMutation({
    mutationFn: async (request: { user_id?: UserId }): Promise<StartReviewResult> => {
      const { data } = await wordbookClient.post<TextApiResponse>(
        '/internal/v1/review/start',
        { user_id: request.user_id || DEFAULT_USER_ID }
      );
      const content = data.content || '';
      // 解析返回的词卡内容，提取 word_id
      const idMatch = content.match(/\[(\d+)\]/);
      return {
        word_id: idMatch ? idMatch[1] : '',
        card: content,
      };
    },
  });
}

// 复习评分
export function useGradeWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: { user_id?: UserId; word_id: string; rating: number }): Promise<GradeResult> => {
      const { data } = await wordbookClient.post<TextApiResponse>(
        '/internal/v1/review/grade',
        {
          user_id: request.user_id || DEFAULT_USER_ID,
          word_id: request.word_id,
          rating: request.rating,
        }
      );
      const content = data.content || '';
      // 解析下次复习时间
      const nextMatch = content.match(/下次复习[:：]\s*(.+)/);
      return {
        success: content.includes('✅') || content.includes('已记录'),
        next_review: nextMatch ? nextMatch[1] : undefined,
      };
    },
    onSuccess: (_, variables) => {
      const userId = variables.user_id || DEFAULT_USER_ID;
      queryClient.invalidateQueries({ queryKey: wordbookKeys.todayReview(userId) });
      queryClient.invalidateQueries({ queryKey: wordbookKeys.stats(userId) });
      queryClient.invalidateQueries({ queryKey: wordbookKeys.list(userId, 'due') });
    },
  });
}

// 获取学习统计
export function useWordbookStats(userId: UserId = DEFAULT_USER_ID) {
  return useQuery({
    queryKey: wordbookKeys.stats(userId),
    queryFn: async (): Promise<WordbookStats> => {
      try {
        // 尝试调用 stats API
        const statsResp = await wordbookClient.post<WordbookStats | TextApiResponse>(
          '/internal/v1/review/stats',
          { user_id: userId }
        );

        // 如果返回 JSON 格式的 stats
        if (statsResp.data && 'total_words' in statsResp.data) {
          return statsResp.data as WordbookStats;
        }
      } catch {
        // stats API 失败，使用备用方案
      }

      // 备用方案：通过 list API 获取统计
      try {
        // 并行获取 new 和 due 列表的计数
        const [newResp, dueResp] = await Promise.all([
          wordbookClient.post<TextApiResponse>(
            '/internal/v1/words/list',
            { user_id: userId, list_type: 'new', limit: 1 }
          ),
          wordbookClient.post<TextApiResponse>(
            '/internal/v1/words/list',
            { user_id: userId, list_type: 'due', limit: 1 }
          ),
        ]);

        // 从头部解析计数
        const newCount = parseWordListTotalCount(newResp.data.content || '');
        const dueCount = parseWordListTotalCount(dueResp.data.content || '');

        return {
          total_words: newCount, // 新词数即总词数（所有词都从new开始）
          new_words: newCount,
          due_words: dueCount,
          reviewed_today: 0,
          streak_days: 0,
        };
      } catch {
        return {
          total_words: 0,
          new_words: 0,
          due_words: 0,
          reviewed_today: 0,
          streak_days: 0,
        };
      }
    },
    staleTime: 30000, // 30 seconds
  });
}
