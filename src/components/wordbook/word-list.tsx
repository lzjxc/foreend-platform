import { useState } from 'react';
import { Search, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWordList, useFindWords, useDeleteWord } from '@/hooks/use-wordbook';
import type { ListType, WordItem } from '@/types/wordbook';

interface WordListProps {
  userId?: string;
  onWordSelect?: (wordId: string) => void;
}

export function WordList({ userId = 'default', onWordSelect }: WordListProps) {
  const [listType, setListType] = useState<ListType>('new');
  const [searchKeyword, setSearchKeyword] = useState('');

  const { data: listData, isLoading: isListLoading } = useWordList(listType, userId);
  const { data: searchData, isLoading: isSearchLoading } = useFindWords(
    searchKeyword,
    userId
  );
  const deleteMutation = useDeleteWord();

  const handleDelete = (wordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个单词吗？')) {
      deleteMutation.mutate({ wordId, userId });
    }
  };

  const isSearchMode = searchKeyword.length >= 2;
  const words = isSearchMode ? searchData?.words : listData?.words;
  const isLoading = isSearchMode ? isSearchLoading : isListLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>词库</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索词库 (至少2个字符)..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* List type tabs (hidden when searching) */}
        {!isSearchMode && (
          <Tabs value={listType} onValueChange={(v) => setListType(v as ListType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="new">新词</TabsTrigger>
              <TabsTrigger value="due">待复习</TabsTrigger>
              <TabsTrigger value="recent">最近复习</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Word list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : words && words.length > 0 ? (
            words.map((word: WordItem) => (
              <div
                key={word.word_id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onWordSelect?.(word.word_id)}
              >
                <span className="font-medium">{word.term}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDelete(word.word_id, e)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {isSearchMode ? '未找到匹配的单词' : '暂无单词'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
