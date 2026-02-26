import { useRef, useState } from 'react';
import { useKnowledgeStore } from '@/stores/knowledge-store';
import { useCapturePreview, useCaptureConfirm, useUploadCapture } from '@/hooks/use-knowledge';
import { ModeSelector } from './mode-selector';
import { ProcessingSteps } from './processing-steps';
import { AnalysisResult } from './analysis-result';
import { McpPanel } from './mcp-panel';
import { TechDocUpload } from './tech-doc-upload';
import type { PreviewAtomResult } from '@/types/knowledge';

type CaptureState = 'idle' | 'analyzing' | 'previewing' | 'confirming' | 'saved';
type ChapterInputMode = 'text' | 'file';

export function CapturePanel() {
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chapterInputMode, setChapterInputMode] = useState<ChapterInputMode>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { captureMode, setStepStatus, resetProcessing } = useKnowledgeStore();
  const preview = useCapturePreview();
  const confirm = useCaptureConfirm();
  const upload = useUploadCapture();
  const [state, setState] = useState<CaptureState>('idle');
  const [previewResult, setPreviewResult] = useState<PreviewAtomResult | null>(null);
  const [previewAtoms, setPreviewAtoms] = useState<PreviewAtomResult[]>([]);

  const isChapter = captureMode === 'chapter';
  const isBook = captureMode === 'book';
  const isMcp = captureMode === 'mcp';
  const isMultiAtom = isChapter || isBook;
  // Show text input: excerpt always, chapter when text tab selected
  const showTextInput = captureMode === 'excerpt' || (isChapter && chapterInputMode === 'text');
  // Show file upload: book always, chapter when file tab selected
  const showFileUpload = isBook || (isChapter && chapterInputMode === 'file');

  // Text submit (excerpt / chapter-text)
  const handleSubmit = async () => {
    if (text.trim().length < 10 || !showTextInput) return;

    setState('analyzing');
    setPreviewResult(null);
    setPreviewAtoms([]);
    resetProcessing();
    setStepStatus('parse', 'active');

    try {
      setStepStatus('parse', 'done');
      setStepStatus('classify', 'active');

      const res = await preview.mutateAsync({
        text: text.trim(),
        mode: captureMode,
        source: source.trim() || undefined,
      });

      setStepStatus('classify', 'done');
      setStepStatus('extract', 'done');
      setStepStatus('connect', 'done');

      if (captureMode === 'chapter' && res.atoms?.length > 0) {
        setPreviewAtoms(res.atoms);
        setPreviewResult(res.atoms[0]);
        setState('previewing');
      } else if (res.atoms?.[0]) {
        setPreviewResult(res.atoms[0]);
        setState('previewing');
      } else {
        setState('idle');
      }
    } catch {
      resetProcessing();
      setState('idle');
    }
  };

  // PDF upload (book / chapter-file)
  const handleUpload = async () => {
    if (!selectedFile) return;

    setState('analyzing');
    setPreviewResult(null);
    setPreviewAtoms([]);
    resetProcessing();
    setStepStatus('parse', 'active');

    try {
      const res = await upload.mutateAsync({
        file: selectedFile,
        source: source.trim() || undefined,
        mode: captureMode === 'chapter' ? 'chapter' : 'book',
      });

      setStepStatus('parse', 'done');
      setStepStatus('classify', 'done');
      setStepStatus('extract', 'done');
      setStepStatus('connect', 'done');

      if (res.atoms && res.atoms.length > 0) {
        setPreviewAtoms(res.atoms);
        setPreviewResult(res.atoms[0]);
        setState('previewing');
      } else {
        setState('idle');
      }
    } catch {
      resetProcessing();
      setState('idle');
    }
  };

  const handleConfirm = async (sourceOverride: Record<string, string>) => {
    if (!previewResult && previewAtoms.length === 0) return;
    setState('confirming');

    try {
      if (isMultiAtom && previewAtoms.length > 0) {
        await confirm.mutateAsync({
          text: text.trim() || selectedFile?.name || '',
          mode: captureMode === 'book' ? 'book' : 'chapter',
          atoms: previewAtoms,
          source_override: Object.keys(sourceOverride).length > 0 ? sourceOverride : undefined,
          notes: notes.trim() || undefined,
        });
      } else if (previewResult) {
        await confirm.mutateAsync({
          text: text.trim(),
          mode: captureMode,
          atom: previewResult,
          source_override: Object.keys(sourceOverride).length > 0 ? sourceOverride : undefined,
          notes: notes.trim() || undefined,
        });
      }

      setStepStatus('store', 'done');
      setState('saved');
      setTimeout(() => handleReset(), 2000);
    } catch {
      setState('previewing');
    }
  };

  const handleCancel = () => {
    setPreviewResult(null);
    setPreviewAtoms([]);
    setState('idle');
    resetProcessing();
  };

  const handleReset = () => {
    setText('');
    setSource('');
    setNotes('');
    setSelectedFile(null);
    setPreviewResult(null);
    setPreviewAtoms([]);
    setState('idle');
    resetProcessing();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') setSelectedFile(file);
  };

  const atomCount = isMultiAtom ? previewAtoms.length : (previewResult ? 1 : 0);

  // MCP mode: delegate to McpPanel
  if (isMcp) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <SectionLabel>捕获模式</SectionLabel>
          <ModeSelector />
        </div>
        <McpPanel />
      </div>
    );
  }

  // Tech Doc mode: delegate to TechDocUpload
  if (captureMode === 'tech_doc') {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <SectionLabel>捕获模式</SectionLabel>
          <ModeSelector />
        </div>
        <TechDocUpload />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Section: Mode */}
      <div>
        <SectionLabel>捕获模式</SectionLabel>
        <ModeSelector />
      </div>

      {/* Section: Input */}
      <div>
        <SectionLabel>
          {isBook ? 'PDF 上传' : isChapter ? '章节内容' : '文本输入'}
        </SectionLabel>

        {/* Chapter mode: text/file toggle */}
        {isChapter && state === 'idle' && (
          <div className="mb-3 flex gap-1 rounded-lg border border-input p-1 w-fit">
            <button
              onClick={() => { setChapterInputMode('text'); setSelectedFile(null); }}
              className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                chapterInputMode === 'text'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              文本输入
            </button>
            <button
              onClick={() => { setChapterInputMode('file'); setText(''); }}
              className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                chapterInputMode === 'file'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              PDF 上传
            </button>
          </div>
        )}

        {showFileUpload ? (
          /* File upload (book / chapter-file) */
          <div
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
              selectedFile
                ? 'border-green-300 bg-green-50/30'
                : 'border-input hover:border-muted-foreground/50 hover:bg-muted/30'
            } ${state === 'analyzing' || state === 'confirming' ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFile(file);
              }}
            />
            {selectedFile ? (
              <>
                <span className="text-[28px]">&#128196;</span>
                <span className="mt-2 text-sm font-semibold text-foreground">
                  {selectedFile.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB · 点击更换
                </span>
              </>
            ) : (
              <>
                <span className="text-[28px] opacity-40">&#128196;</span>
                <span className="mt-2 text-sm text-muted-foreground">
                  拖放 PDF 文件到此处，或点击选择
                </span>
                <span className="text-[11px] text-muted-foreground">
                  支持 PDF 格式，最大 50MB
                </span>
              </>
            )}
          </div>
        ) : (
          /* Text mode: textarea (excerpt / chapter-text) */
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={captureMode === 'chapter'
              ? '粘贴一整章或长篇笔记，AI 会自动拆解为多个知识原子...'
              : '粘贴一段文字、一个观点、一条笔记...'}
            rows={captureMode === 'chapter' ? 10 : 6}
            disabled={state === 'analyzing' || state === 'confirming'}
            className="w-full resize-none rounded-xl border border-input bg-transparent p-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
        )}

        {/* Source & Notes row */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="来源（书名、URL、对话...）"
            disabled={state === 'analyzing' || state === 'confirming'}
            className="rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="你的备注（可选）"
            disabled={state === 'analyzing' || state === 'confirming'}
            className="rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {showFileUpload
              ? selectedFile ? `${selectedFile.name} · ${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : '请选择 PDF 文件'
              : `${text.length} 字符${text.trim().length < 10 && text.length > 0 ? ' · 至少 10 字' : ''}`
            }
            {isChapter && ' · 章节模式'}
            {isBook && ' · 整书模式'}
          </span>
          <div className="flex gap-2">
            {(text || selectedFile || previewResult || previewAtoms.length > 0) && state !== 'analyzing' && state !== 'confirming' && (
              <button
                onClick={handleReset}
                className="rounded-md border border-border px-4 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted"
              >
                清空
              </button>
            )}
            {state === 'idle' && showFileUpload && (
              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className={`rounded-md px-6 py-2 text-[13px] font-semibold transition-all ${
                  selectedFile
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'cursor-not-allowed bg-muted text-muted-foreground'
                }`}
              >
                {isChapter ? '开始拆解' : '开始提取'}
              </button>
            )}
            {state === 'idle' && showTextInput && (
              <button
                onClick={handleSubmit}
                disabled={text.trim().length < 10}
                className={`rounded-md px-6 py-2 text-[13px] font-semibold transition-all ${
                  text.trim().length >= 10
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'cursor-not-allowed bg-muted text-muted-foreground'
                }`}
              >
                {captureMode === 'chapter' ? '开始拆解' : '开始分析'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Processing animation */}
      {state === 'analyzing' && (
        upload.phase === 'uploading' ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              正在上传文件到存储...
            </div>
            <p className="mt-1 text-[12px] text-blue-600">
              {selectedFile?.name} · {((selectedFile?.size ?? 0) / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        ) : (
          <ProcessingSteps />
        )
      )}

      {/* Success message */}
      {state === 'saved' && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-[13px] text-green-700">
          {atomCount > 1 ? `${atomCount} 个知识原子已保存到知识库` : '知识原子已保存到知识库'}
        </div>
      )}

      {/* Preview result */}
      {(state === 'previewing' || state === 'confirming') && (previewResult || previewAtoms.length > 0) && (
        <AnalysisResult
          preview={previewResult!}
          allAtoms={isMultiAtom ? previewAtoms : undefined}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isConfirming={state === 'confirming'}
        />
      )}

      {/* Error */}
      {preview.isError && state === 'idle' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
          分析失败: {preview.error?.message || '未知错误'}
        </div>
      )}
      {upload.isError && state === 'idle' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
          提取失败: {upload.error?.message || '未知错误'}
        </div>
      )}
      {confirm.isError && state === 'previewing' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
          保存失败: {confirm.error?.message || '未知错误'}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </div>
  );
}
