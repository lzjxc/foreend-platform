import { useRef, useState, useCallback } from 'react';
import JSZip from 'jszip';
import { useTechDocImport } from '@/hooks/use-tech-doc-import';
import type { TechDocMeta } from '@/types/knowledge';

type UploadState = 'idle' | 'file_selected' | 'meta_parsed' | 'meta_error';

export function TechDocUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<TechDocMeta | null>(null);
  const [mdFiles, setMdFiles] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const { submit, jobStatus, state: importState, error: importError, reset: resetImport } = useTechDocImport();

  const parseZip = useCallback(async (file: File) => {
    setSelectedFile(file);
    setUploadState('file_selected');
    setParseError(null);

    try {
      const zip = await JSZip.loadAsync(file);
      const metaFile = zip.file('meta.json');
      if (!metaFile) {
        setParseError('ZIP 包中缺少 meta.json 文件');
        setUploadState('meta_error');
        return;
      }

      const metaContent = await metaFile.async('string');
      const parsed = JSON.parse(metaContent) as TechDocMeta;

      if (!parsed.technology) {
        setParseError('meta.json 缺少 technology 字段');
        setUploadState('meta_error');
        return;
      }
      if (!parsed.source_hierarchy?.lv1) {
        setParseError('meta.json 缺少 source_hierarchy.lv1 字段');
        setUploadState('meta_error');
        return;
      }

      const files = Object.keys(zip.files).filter(
        (f) => f.endsWith('.md') && !zip.files[f].dir
      );

      if (files.length === 0) {
        setParseError('ZIP 包中没有 .md 文件');
        setUploadState('meta_error');
        return;
      }

      setMeta(parsed);
      setMdFiles(files);
      setUploadState('meta_parsed');
    } catch (e) {
      setParseError(e instanceof SyntaxError ? 'meta.json 格式错误' : '解析 ZIP 文件失败');
      setUploadState('meta_error');
    }
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed')) {
      parseZip(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseZip(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    await submit(selectedFile);
  };

  const handleReset = () => {
    setUploadState('idle');
    setSelectedFile(null);
    setMeta(null);
    setMdFiles([]);
    setParseError(null);
    resetImport();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Working states from the hook
  const isWorking = importState === 'uploading' || importState === 'submitting' || importState === 'polling';

  // ── Done state ──
  if (importState === 'done') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-6 text-center">
          <div className="text-2xl">&#10003;</div>
          <h3 className="mt-2 text-sm font-semibold text-green-800">导入完成</h3>
          <p className="mt-1 text-[13px] text-green-700">
            共生成 <span className="font-semibold">{jobStatus?.atoms_created ?? 0}</span> 个知识原子
            {meta && (
              <span className="ml-2 text-green-600">
                {meta.technology}{meta.version ? ` ${meta.version}` : ''}
              </span>
            )}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                // Navigate to atoms list with domain filter
                const params = new URLSearchParams();
                if (meta?.technology) params.set('domain', meta.technology.toLowerCase().replace(/\s+/g, '-'));
                const tab = document.querySelector('[data-tab="search"]') as HTMLElement;
                if (tab) tab.click();
              }}
              className="rounded-md border border-green-300 bg-white px-4 py-2 text-[13px] font-medium text-green-700 transition-colors hover:bg-green-50"
            >
              查看导入的 Atoms
            </button>
            <button
              onClick={handleReset}
              className="rounded-md bg-green-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-green-700"
            >
              继续导入
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state (from import) ──
  if (importState === 'error') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center">
          <div className="text-2xl">&#10007;</div>
          <h3 className="mt-2 text-sm font-semibold text-red-800">导入失败</h3>
          <p className="mt-1 text-[13px] text-red-600">{importError}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-[13px] font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              重新选择文件
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-md bg-red-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-red-700"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Working state (uploading → submitting → polling) ──
  if (isWorking) {
    // Phase 1: Uploading to file-gateway
    if (importState === 'uploading') {
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              正在上传文件到存储...
            </div>
            <p className="mt-2 text-[12px] text-blue-600">
              {selectedFile?.name} · {((selectedFile?.size ?? 0) / 1024 / 1024).toFixed(1)} MB
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
              <div className="h-full w-full animate-pulse rounded-full bg-blue-400" />
            </div>
          </div>
        </div>
      );
    }

    // Phase 2: Submitting + polling backend
    const total = jobStatus?.total_files ?? mdFiles.length;
    const processed = jobStatus?.processed_files ?? 0;
    const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/30 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-800">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
            正在解析文档...
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px] text-cyan-700">
              <span>{processed} / {total} 文件</span>
              <span>{pct}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cyan-100">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {jobStatus?.current_file && (
            <p className="mt-3 text-[12px] text-cyan-600">
              当前：<span className="font-mono">{jobStatus.current_file}</span>
              {jobStatus.atoms_created != null && (
                <span className="ml-2">已生成 {jobStatus.atoms_created} atoms</span>
              )}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Idle / file_selected / meta_parsed / meta_error ──
  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
          selectedFile
            ? uploadState === 'meta_error'
              ? 'border-red-300 bg-red-50/30'
              : 'border-green-300 bg-green-50/30'
            : 'border-input hover:border-muted-foreground/50 hover:bg-muted/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={handleFileSelect}
        />
        {selectedFile ? (
          <>
            <span className="text-[28px]">&#128230;</span>
            <span className="mt-2 text-sm font-semibold text-foreground">
              {selectedFile.name}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(1)} MB · 点击更换
            </span>
          </>
        ) : (
          <>
            <span className="text-[28px] opacity-40">&#128230;</span>
            <span className="mt-2 text-sm text-muted-foreground">
              拖放 ZIP 文件到此处，或点击选择
            </span>
            <span className="text-[11px] text-muted-foreground">
              支持格式：.zip（内含 .md + meta.json）
            </span>
          </>
        )}
      </div>

      {/* Parse error */}
      {uploadState === 'meta_error' && parseError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
          {parseError}
        </div>
      )}

      {/* Meta preview */}
      {uploadState === 'meta_parsed' && meta && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/30 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-800">
            <span>&#10003;</span> 已解析 meta.json
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
            <div>
              <span className="text-muted-foreground">技术栈：</span>
              <span className="font-medium text-foreground">{meta.technology}</span>
            </div>
            {meta.version && (
              <div>
                <span className="text-muted-foreground">版本：</span>
                <span className="font-medium text-foreground">{meta.version}</span>
              </div>
            )}
            <div className="col-span-2">
              <span className="text-muted-foreground">来源：</span>
              <span className="font-medium text-foreground">
                {[meta.source_hierarchy.lv1, meta.source_hierarchy.lv2, meta.source_hierarchy.lv3, meta.source_hierarchy.lv4]
                  .filter(Boolean)
                  .join(' > ')}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <span className="text-[12px] text-muted-foreground">
              包含文件：{mdFiles.length} 个 .md 文件
            </span>
            <div className="mt-1.5 max-h-[120px] overflow-y-auto rounded-md border border-cyan-200 bg-white/50 p-2">
              {mdFiles.map((f) => (
                <div key={f} className="truncate font-mono text-[11px] text-muted-foreground leading-relaxed">
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              className="rounded-md bg-cyan-600 px-6 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-cyan-700"
            >
              开始导入
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
