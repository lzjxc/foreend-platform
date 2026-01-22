import { useState } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchWord, useAddWord } from '@/hooks/use-wordbook';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface WordSearchProps {
  userId?: string;
}

export function WordSearch({ userId = 'default' }: WordSearchProps) {
  const [term, setTerm] = useState('');
  const [searchedTerm, setSearchedTerm] = useState('');

  const searchMutation = useSearchWord();
  const addMutation = useAddWord();

  const handleSearch = async () => {
    if (!term.trim()) return;
    setSearchedTerm(term.trim());
    searchMutation.mutate({
      user_id: userId,
      term: term.trim(),
      mode: 'full',
    });
  };

  const handleAdd = async () => {
    if (!searchedTerm) return;
    addMutation.mutate({
      user_id: userId,
      term: searchedTerm,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          查词
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search input */}
        <div className="flex gap-2">
          <Input
            placeholder="输入要查询的单词..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={!term.trim() || searchMutation.isPending}
          >
            {searchMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search result */}
        {searchMutation.data && (
          <div className="space-y-4">
            {searchMutation.data.found ? (
              <>
                <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/50 rounded-lg">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {searchMutation.data.card}
                  </ReactMarkdown>
                </div>
                <Button
                  onClick={handleAdd}
                  disabled={addMutation.isPending}
                  className="w-full"
                >
                  {addMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  加入词库
                </Button>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                未找到单词 "{searchedTerm}"
              </div>
            )}
          </div>
        )}

        {/* Add success message */}
        {addMutation.data?.added && (
          <div className="text-center text-green-600 py-2">
            已添加到词库
          </div>
        )}

        {/* Error message */}
        {(searchMutation.error || addMutation.error) && (
          <div className="text-center text-destructive py-2">
            {(searchMutation.error || addMutation.error)?.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
