import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload,
  FolderOpen,
  File,
  Image,
  FileText,
  Copy,
  Download,
  Trash2,
  RefreshCw,
  Grid,
  List,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn, formatFileSize, isImageFile, isPdfFile } from '@/lib/utils';

interface Bucket {
  name: string;
  fileCount?: number;
}

interface FileItem {
  key: string;
  size: number;
  lastModified: string;
  url: string;
}

export default function Files() {
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Use nginx proxy in production, Vite proxy in development
  const FILE_GATEWAY_URL = import.meta.env.DEV
    ? '/file-api'  // Proxied through Vite
    : '/file-gateway';  // Proxied through nginx in production

  const fetchBuckets = useCallback(async () => {
    try {
      const response = await fetch(`${FILE_GATEWAY_URL}/api/v1/buckets`);
      if (response.ok) {
        const data = await response.json();
        const bucketList = data.buckets || [];
        setBuckets(bucketList);
        // Auto-select first bucket and fetch its files
        if (bucketList.length > 0) {
          const firstBucket = bucketList[0].name;
          setSelectedBucket(firstBucket);
          // Fetch files for the first bucket
          const filesResponse = await fetch(`${FILE_GATEWAY_URL}/api/v1/files/${firstBucket}?max_keys=1000`);
          if (filesResponse.ok) {
            const filesData = await filesResponse.json();
            const mappedFiles: FileItem[] = (filesData.files || []).map((f: { key: string; size: number; last_modified: string; url: string }) => ({
              key: f.key,
              size: f.size,
              lastModified: f.last_modified,
              url: f.url,
            }));
            // Sort by lastModified descending (newest first)
            mappedFiles.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
            setFiles(mappedFiles);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch buckets:', error);
    }
  }, [FILE_GATEWAY_URL]);

  const fetchFiles = useCallback(async (bucket: string) => {
    if (!bucket) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${FILE_GATEWAY_URL}/api/v1/files/${bucket}?max_keys=1000`);
      if (response.ok) {
        const data = await response.json();
        // Map API response (snake_case) to frontend format (camelCase)
        const mappedFiles: FileItem[] = (data.files || []).map((f: { key: string; size: number; last_modified: string; url: string }) => ({
          key: f.key,
          size: f.size,
          lastModified: f.last_modified,
          url: f.url,
        }));
        // Sort by lastModified descending (newest first)
        mappedFiles.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
        setFiles(mappedFiles);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [FILE_GATEWAY_URL]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedBucket) return;

    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', selectedBucket);

      try {
        const response = await fetch(`${FILE_GATEWAY_URL}/api/v1/files/upload`, {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          fetchFiles(selectedBucket);
        }
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    }
  }, [FILE_GATEWAY_URL, selectedBucket, fetchFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
    noKeyboard: true,
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const deleteFile = async (key: string) => {
    if (!selectedBucket) return;
    if (!confirm('确定要删除此文件吗?')) return;

    try {
      const response = await fetch(
        `${FILE_GATEWAY_URL}/api/v1/files/${selectedBucket}/${encodeURIComponent(key)}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        fetchFiles(selectedBucket);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const getFileIcon = (filename: string) => {
    if (isImageFile(filename)) return Image;
    if (isPdfFile(filename)) return FileText;
    return File;
  };

  // Load buckets on mount
  useEffect(() => {
    fetchBuckets();
  }, []);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar - Buckets */}
      <Card className="w-48 shrink-0">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Buckets</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchBuckets}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-1">
            {buckets.length === 0 ? (
              <p className="px-2 text-xs text-muted-foreground">
                点击刷新加载 Buckets
              </p>
            ) : (
              buckets.map((bucket) => (
                <button
                  key={bucket.name}
                  onClick={() => {
                    setSelectedBucket(bucket.name);
                    fetchFiles(bucket.name);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                    selectedBucket === bucket.name
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  )}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span className="truncate">{bucket.name}</span>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {selectedBucket || '选择一个 Bucket'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {files.length} 个文件
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchFiles(selectedBucket)}
              disabled={!selectedBucket}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          )}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              拖拽文件到此处上传，或点击选择文件
            </p>
          </div>
        </div>

        {/* File List */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="h-full overflow-auto p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">
                  {selectedBucket ? '暂无文件' : '请先选择一个 Bucket'}
                </p>
              </div>
            ) : viewMode === 'list' ? (
              <table className="w-full">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="p-3">文件名</th>
                    <th className="p-3 w-24">大小</th>
                    <th className="p-3 w-36">修改时间</th>
                    <th className="p-3 w-32">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const FileIcon = getFileIcon(file.key);
                    return (
                      <tr key={file.key} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{file.key}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(file.lastModified).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => copyUrl(file.url)}
                              title="复制 URL"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              asChild
                              title="下载"
                            >
                              <a href={file.url} download target="_blank" rel="noreferrer">
                                <Download className="h-3 w-3" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteFile(file.key)}
                              title="删除"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="grid grid-cols-4 gap-4 p-4">
                {files.map((file) => {
                  const FileIcon = getFileIcon(file.key);
                  return (
                    <Card key={file.key} className="overflow-hidden">
                      <div className="flex h-24 items-center justify-center bg-muted">
                        {isImageFile(file.key) ? (
                          <img
                            src={file.url}
                            alt={file.key}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <CardContent className="p-2">
                        <p className="truncate text-sm" title={file.key}>
                          {file.key}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
