import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Upload,
  FolderOpen,
  Folder,
  FolderPlus,
  File,
  Image,
  FileText,
  Copy,
  Download,
  Trash2,
  RefreshCw,
  Grid,
  List,
  HardDrive,
  Cloud,
  ChevronRight,
  Home,
  Plus,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn, formatFileSize, isImageFile, isPdfFile } from '@/lib/utils';
import { toast } from 'sonner';

interface Platform {
  id: string;
  name: string;
  type: string;
  is_default: boolean;
  status: string;
}

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

interface FolderItem {
  name: string;
  path: string;
}

interface ParsedItems {
  folders: FolderItem[];
  files: FileItem[];
}

export default function Files() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('minio');
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBucketsLoading, setIsBucketsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPath, setCurrentPath] = useState<string>(''); // Current directory path
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showCreateBucketDialog, setShowCreateBucketDialog] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);

  // Track current request to prevent race conditions (use ref for async callbacks)
  const requestIdRef = useRef(0);

  // Use nginx proxy (same path for both dev and prod)
  const FILE_GATEWAY_URL = '/file-api';

  // Platform icon helper
  const getPlatformIcon = (platformId: string) => {
    return platformId === 'gdrive' ? Cloud : HardDrive;
  };

  // Fetch available platforms
  const fetchPlatforms = useCallback(async () => {
    try {
      const response = await fetch(`${FILE_GATEWAY_URL}/api/v1/platforms`);
      if (response.ok) {
        const data = await response.json();
        const platformList = data.platforms || [];
        setPlatforms(platformList);
        // Set default platform if available
        if (platformList.length > 0) {
          const defaultPlatform = platformList.find((p: Platform) => p.is_default)?.id || platformList[0].id;
          setSelectedPlatform(defaultPlatform);
          return defaultPlatform;
        }
      }
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
    }
    return 'minio';
  }, [FILE_GATEWAY_URL]);

  const fetchBuckets = useCallback(async (platform: string, requestId: number) => {
    setIsBucketsLoading(true);
    setIsLoading(true);
    try {
      // v2.2.0: Use platforms API
      const response = await fetch(`${FILE_GATEWAY_URL}/api/v1/platforms/${platform}/buckets`);

      // Check if this request is still current (prevent race condition)
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const bucketList = data.buckets || [];
        setBuckets(bucketList);
        // Auto-select first bucket and fetch its files
        if (bucketList.length > 0) {
          const firstBucket = bucketList[0].name;
          setSelectedBucket(firstBucket);
          // Fetch files for the first bucket
          const filesResponse = await fetch(`${FILE_GATEWAY_URL}/api/v1/files/${platform}/${firstBucket}?max_keys=1000`);

          // Check again after files fetch
          if (requestId !== requestIdRef.current) {
            return;
          }

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
        } else {
          setSelectedBucket('');
          setFiles([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch buckets:', error);
    } finally {
      // Only clear loading if this is still the current request
      if (requestId === requestIdRef.current) {
        setIsBucketsLoading(false);
        setIsLoading(false);
      }
    }
  }, [FILE_GATEWAY_URL]);

  const fetchFiles = useCallback(async (bucket: string, platform: string = selectedPlatform, prefix: string = '') => {
    if (!bucket) return;
    setIsLoading(true);
    try {
      // Add prefix parameter for subdirectory listing
      const prefixParam = prefix ? `&prefix=${encodeURIComponent(prefix + '/')}` : '';
      const response = await fetch(`${FILE_GATEWAY_URL}/api/v1/files/${platform}/${bucket}?max_keys=1000${prefixParam}`);
      if (response.ok) {
        const data = await response.json();
        // Map API response (snake_case) to frontend format (camelCase)
        const mappedFiles: FileItem[] = (data.files || []).map((f: { key: string; size: number; last_modified: string; url: string }) => ({
          key: f.key,
          size: f.size,
          lastModified: f.last_modified,
          url: f.url,
        }));
        // Sort: folders first (size 0 and ends with /), then by lastModified descending
        mappedFiles.sort((a, b) => {
          const aIsFolder = a.key.endsWith('/') && a.size === 0;
          const bIsFolder = b.key.endsWith('/') && b.size === 0;
          if (aIsFolder && !bIsFolder) return -1;
          if (!aIsFolder && bIsFolder) return 1;
          return new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime();
        });
        setFiles(mappedFiles);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [FILE_GATEWAY_URL, selectedPlatform]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedBucket) return;

    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', selectedBucket);
      formData.append('platform', selectedPlatform);
      // Add path prefix if we're in a subdirectory
      if (currentPath) {
        formData.append('path', currentPath);
      }

      try {
        const response = await fetch(`${FILE_GATEWAY_URL}/api/v1/files/upload`, {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          fetchFiles(selectedBucket, selectedPlatform);
        }
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    }
  }, [FILE_GATEWAY_URL, selectedBucket, selectedPlatform, currentPath, fetchFiles]);

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
        `${FILE_GATEWAY_URL}/api/v1/files/${selectedPlatform}/${selectedBucket}/${encodeURIComponent(key)}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        fetchFiles(selectedBucket, selectedPlatform);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const downloadFile = async (key: string) => {
    if (!selectedBucket) return;

    try {
      // Use file-gateway accelerated download API
      const response = await fetch(
        `${FILE_GATEWAY_URL}/api/v1/files/${selectedPlatform}/${selectedBucket}/${encodeURIComponent(key)}/download?accelerate=true&ttl=300`
      );
      if (response.ok) {
        const data = await response.json();
        const url = data.download_url || data.url;
        if (url) {
          if (data.accelerated) {
            toast.success('已获取加速下载链接');
          } else {
            toast.info('加速不可用，使用直链下载');
          }
          window.open(url, '_blank');
        } else {
          toast.error('获取下载链接失败');
        }
      } else {
        toast.error('获取下载链接失败');
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error('下载请求失败');
    }
  };

  const createFolder = async () => {
    if (!selectedBucket || !newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      // Build the full folder path
      const folderPath = currentPath
        ? `${currentPath}/${newFolderName.trim()}`
        : newFolderName.trim();

      const response = await fetch(`${FILE_GATEWAY_URL}/api/v1/files/folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          bucket: selectedBucket,
          path: folderPath,
        }),
      });

      if (response.ok) {
        setShowCreateFolderDialog(false);
        setNewFolderName('');
        fetchFiles(selectedBucket, selectedPlatform, currentPath);
      } else {
        const error = await response.json();
        console.error('Failed to create folder:', error);
        alert(`创建文件夹失败: ${error.detail || '未知错误'}`);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('创建文件夹失败');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const createBucket = async () => {
    if (!newBucketName.trim()) return;

    setIsCreatingBucket(true);
    try {
      const response = await fetch(`${FILE_GATEWAY_URL}/api/v1/platforms/${selectedPlatform}/buckets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBucketName.trim(),
        }),
      });

      if (response.ok) {
        setShowCreateBucketDialog(false);
        setNewBucketName('');
        // Refresh buckets list
        requestIdRef.current += 1;
        fetchBuckets(selectedPlatform, requestIdRef.current);
      } else {
        const error = await response.json();
        console.error('Failed to create bucket:', error);
        alert(`创建 Bucket 失败: ${error.detail || '未知错误'}`);
      }
    } catch (error) {
      console.error('Failed to create bucket:', error);
      alert('创建 Bucket 失败');
    } finally {
      setIsCreatingBucket(false);
    }
  };

  // Handle platform change
  const handlePlatformChange = (platformId: string) => {
    // Increment request ID to cancel any pending requests
    requestIdRef.current += 1;
    const newRequestId = requestIdRef.current;

    setSelectedPlatform(platformId);
    setSelectedBucket('');
    setBuckets([]);
    setFiles([]);
    setCurrentPath(''); // Reset path when changing platform
    fetchBuckets(platformId, newRequestId);
  };

  // Handle bucket change
  const handleBucketChange = (bucketName: string) => {
    setSelectedBucket(bucketName);
    setCurrentPath(''); // Reset path when changing bucket
    fetchFiles(bucketName, selectedPlatform);
  };

  const getFileIcon = (filename: string) => {
    if (isImageFile(filename)) return Image;
    if (isPdfFile(filename)) return FileText;
    return File;
  };

  // Parse files to get folders and files at current path level
  const parseFilesAtPath = useCallback((allFiles: FileItem[], path: string): ParsedItems => {
    const folders = new Set<string>();
    const filesAtPath: FileItem[] = [];

    const prefix = path ? `${path}/` : '';

    allFiles.forEach((file) => {
      // Check if file is under current path
      if (path && !file.key.startsWith(prefix)) {
        return;
      }

      // Get the relative path from current directory
      const relativePath = path ? file.key.slice(prefix.length) : file.key;

      // Check if this is a folder (has more path segments)
      const slashIndex = relativePath.indexOf('/');
      if (slashIndex !== -1) {
        // This is a folder - extract folder name
        const folderName = relativePath.slice(0, slashIndex);
        folders.add(folderName);
      } else if (relativePath) {
        // This is a file at current level
        filesAtPath.push(file);
      }
    });

    // Convert folders set to array of FolderItem
    const folderItems: FolderItem[] = Array.from(folders)
      .sort()
      .map((name) => ({
        name,
        path: path ? `${path}/${name}` : name,
      }));

    return { folders: folderItems, files: filesAtPath };
  }, []);

  // Get parsed items for current path
  const { folders: currentFolders, files: currentFiles } = parseFilesAtPath(files, currentPath);

  // Navigate to a path (folder or root)
  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    fetchFiles(selectedBucket, selectedPlatform, path);
  };

  // Navigate to a folder (alias for navigateToPath)
  const navigateToFolder = (folderPath: string) => {
    navigateToPath(folderPath);
  };

  // Get breadcrumb segments
  const getBreadcrumbs = () => {
    if (!currentPath) return [];
    return currentPath.split('/');
  };

  // Load platforms and buckets on mount
  useEffect(() => {
    const init = async () => {
      const defaultPlatform = await fetchPlatforms();
      fetchBuckets(defaultPlatform, 0);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar - Platforms & Buckets */}
      <Card className="w-52 shrink-0">
        {/* Platform Selector */}
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">平台</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="flex gap-1">
            {platforms.map((platform) => {
              const PlatformIcon = getPlatformIcon(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformChange(platform.id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    selectedPlatform === platform.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-accent'
                  )}
                  title={platform.name}
                >
                  <PlatformIcon className="h-3.5 w-3.5" />
                  <span>{platform.id === 'gdrive' ? 'GDrive' : 'MinIO'}</span>
                </button>
              );
            })}
          </div>
          {platforms.length === 0 && (
            <p className="px-2 py-1 text-xs text-muted-foreground">加载中...</p>
          )}
        </CardContent>

        {/* Buckets */}
        <CardHeader className="p-4 pb-2 pt-2 border-t">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Buckets</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowCreateBucketDialog(true)}
                title="新建 Bucket"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                requestIdRef.current += 1;
                fetchBuckets(selectedPlatform, requestIdRef.current);
              }}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-1">
            {isBucketsLoading ? (
              <div className="space-y-1">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : buckets.length === 0 ? (
              <p className="px-2 text-xs text-muted-foreground">
                {selectedPlatform ? '暂无 Buckets' : '请先选择平台'}
              </p>
            ) : (
              buckets.map((bucket) => (
                <button
                  key={bucket.name}
                  onClick={() => handleBucketChange(bucket.name)}
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
            {/* Breadcrumb Navigation */}
            {selectedBucket && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <button
                  onClick={() => navigateToPath('')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  <Home className="h-3.5 w-3.5" />
                </button>
                {getBreadcrumbs().map((segment, index, arr) => (
                  <span key={index} className="flex items-center gap-1">
                    <ChevronRight className="h-3.5 w-3.5" />
                    <button
                      onClick={() => navigateToPath(arr.slice(0, index + 1).join('/'))}
                      className={cn(
                        'hover:text-foreground transition-colors',
                        index === arr.length - 1 && 'text-foreground font-medium'
                      )}
                    >
                      {segment}
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {selectedPlatform === 'gdrive' ? 'Google Drive' : 'MinIO'} · {currentFolders.length} 个文件夹 · {currentFiles.length} 个文件
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
              onClick={() => setShowCreateFolderDialog(true)}
              disabled={!selectedBucket}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              新建文件夹
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
            ) : currentFolders.length === 0 && currentFiles.length === 0 ? (
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
                  {/* Folders first */}
                  {currentFolders.map((folder) => (
                    <tr
                      key={folder.path}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigateToFolder(folder.path)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-yellow-500" />
                          <span className="truncate font-medium">{folder.name}/</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">—</td>
                      <td className="p-3 text-sm text-muted-foreground">—</td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToFolder(folder.path);
                          }}
                        >
                          打开
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {/* Then files */}
                  {currentFiles.map((file) => {
                    const FileIcon = getFileIcon(file.key);
                    const fileName = file.key.split('/').pop() || file.key;
                    return (
                      <tr key={file.key} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{fileName}</span>
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
                              onClick={() => downloadFile(file.key)}
                              title="下载 (加速)"
                            >
                              <Download className="h-3 w-3" />
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
                {/* Folders first */}
                {currentFolders.map((folder) => (
                  <Card
                    key={folder.path}
                    className="overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    onClick={() => navigateToFolder(folder.path)}
                  >
                    <div className="flex h-24 items-center justify-center bg-muted">
                      <Folder className="h-12 w-12 text-yellow-500" />
                    </div>
                    <CardContent className="p-2">
                      <p className="truncate text-sm font-medium" title={folder.name}>
                        {folder.name}/
                      </p>
                      <p className="text-xs text-muted-foreground">文件夹</p>
                    </CardContent>
                  </Card>
                ))}
                {/* Then files */}
                {currentFiles.map((file) => {
                  const FileIcon = getFileIcon(file.key);
                  const fileName = file.key.split('/').pop() || file.key;
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
                        <p className="truncate text-sm" title={fileName}>
                          {fileName}
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

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="文件夹名称"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFolderName.trim()) {
                  createFolder();
                }
              }}
              autoFocus
            />
            {currentPath && (
              <p className="mt-2 text-sm text-muted-foreground">
                将创建在: {currentPath}/
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateFolderDialog(false);
                setNewFolderName('');
              }}
            >
              取消
            </Button>
            <Button
              onClick={createFolder}
              disabled={!newFolderName.trim() || isCreatingFolder}
            >
              {isCreatingFolder ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Bucket Dialog */}
      <Dialog open={showCreateBucketDialog} onOpenChange={setShowCreateBucketDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建 Bucket</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Bucket 名称 (3-63 字符)"
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newBucketName.trim()) {
                  createBucket();
                }
              }}
              autoFocus
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedPlatform === 'gdrive'
                ? '将在 Google Drive 根目录创建文件夹'
                : '将创建新的 MinIO 存储桶'}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateBucketDialog(false);
                setNewBucketName('');
              }}
            >
              取消
            </Button>
            <Button
              onClick={createBucket}
              disabled={!newBucketName.trim() || isCreatingBucket}
            >
              {isCreatingBucket ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
