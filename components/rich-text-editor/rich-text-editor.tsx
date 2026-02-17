"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createEditorExtensions } from "./editor-extensions";
import { EditorToolbar } from "./editor-toolbar";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import { LinkDialog } from "./editor-link-dialog";
import { EditorImageUpload } from "./editor-image-upload";
import { EditorYoutubeDialog } from "./editor-youtube-dialog";
import { cn } from "@/lib/utils";

export type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  showCharCount?: boolean;
  showFullscreen?: boolean;
};

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").filter(Boolean).length : 0;
}

function countChars(html: string): number {
  return html.replace(/<[^>]*>/g, "").length;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  disabled = false,
  minHeight = "200px",
  showCharCount = true,
  showFullscreen = true,
}: RichTextEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const extensions = useMemo(
    () => createEditorExtensions(placeholder),
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-w-0 p-4 focus:outline-none prose prose-sm dark:prose-invert max-w-none " +
          "[&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:first:mt-0 " +
          "[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 " +
          "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 " +
          "[&_p]:mb-2 [&_p:last-child]:mb-0 " +
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ul]:space-y-1 " +
          "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_ol]:space-y-1 " +
          "[&_strong]:font-semibold [&_em]:italic [&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground [&_blockquote]:pl-4 [&_blockquote]:italic " +
          "[&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:my-2 [&_pre]:overflow-x-auto " +
          "[&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:p-2 [&_td]:border [&_td]:border-border [&_td]:p-2 [&_hr]:my-4",
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain")?.trim();
        if (text && /^https?:\/\/\S+$/.test(text) && !event.clipboardData?.getData("text/html")) {
          const { state } = view;
          const { from, to } = state.selection;
          const linkMark = state.schema.marks.link.create({ href: text });
          const node = state.schema.text(text, [linkMark]);
          const tr = state.tr.replaceRangeWith(from, to, node);
          view.dispatch(tr);
          return true;
        }
        return false;
      },
    },
  });

  // Sync value when it changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const handleLinkClick = useCallback(() => {
    if (!editor) return;
    if (editor.isActive("link")) {
      const { href } = editor.getAttributes("link");
      setLinkUrl(href ?? "");
      setLinkTitle("");
    } else {
      setLinkUrl("");
      setLinkTitle("");
    }
    setLinkDialogOpen(true);
  }, [editor]);

  const handleLinkConfirm = useCallback(
    (url: string, title?: string) => {
      if (!editor) return;
      if (editor.isActive("link")) {
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      } else if (title) {
        editor
          .chain()
          .focus()
          .insertContent([
            {
              type: "text",
              text: title,
              marks: [{ type: "link", attrs: { href: url } }],
            },
          ])
          .run();
      } else {
        editor.chain().focus().setLink({ href: url }).run();
      }
      setLinkDialogOpen(false);
    },
    [editor]
  );

  const handleImageInsert = useCallback(
    (url: string) => {
      editor?.chain().focus().setImage({ src: url }).run();
      setImageUploadOpen(false);
    },
    [editor]
  );

  const handleTableInsert = useCallback(() => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const handleYoutubeInsert = useCallback(
    (src: string) => {
      editor?.chain().focus().setYoutubeVideo({ src }).run();
      setYoutubeDialogOpen(false);
    },
    [editor]
  );

  const charCount = useMemo(() => (value ? countChars(value) : 0), [value]);
  const wordCount = useMemo(() => (value ? countWords(value) : 0), [value]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-input bg-background transition-all",
        isFullscreen &&
          "fixed inset-4 z-50 flex flex-col rounded-lg border-2 bg-background shadow-xl"
      )}
      data-disabled={disabled ? "true" : undefined}
    >
      <EditorToolbar
        editor={editor}
        onLinkClick={handleLinkClick}
        onImageClick={() => setImageUploadOpen(true)}
        onTableClick={handleTableInsert}
        onYoutubeClick={() => setYoutubeDialogOpen(true)}
        isFullscreen={isFullscreen}
        onFullscreenToggle={
          showFullscreen ? () => setIsFullscreen((p) => !p) : undefined
        }
        showCharCount={showCharCount}
        charCount={charCount}
        wordCount={wordCount}
      />

      {linkDialogOpen && (
        <LinkDialog
          open={linkDialogOpen}
          initialUrl={linkUrl}
          initialTitle={linkTitle}
          onConfirm={handleLinkConfirm}
          onCancel={() => setLinkDialogOpen(false)}
        />
      )}

      {imageUploadOpen && (
        <EditorImageUpload
          open={imageUploadOpen}
          onInsert={handleImageInsert}
          onCancel={() => setImageUploadOpen(false)}
        />
      )}

      {youtubeDialogOpen && (
        <EditorYoutubeDialog
          open={youtubeDialogOpen}
          onInsert={handleYoutubeInsert}
          onCancel={() => setYoutubeDialogOpen(false)}
        />
      )}

      {editor && (
        <EditorBubbleMenu editor={editor} onLinkClick={handleLinkClick} />
      )}

      <div
        className={cn("relative flex-1", isFullscreen && "min-h-0")}
        style={{ minHeight: isFullscreen ? undefined : minHeight }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Code block syntax highlighting styles */}
      <style jsx global>{`
        .hljs-comment,
        .hljs-quote {
          color: #6a737d;
        }
        .hljs-variable,
        .hljs-template-variable,
        .hljs-attribute,
        .hljs-tag,
        .hljs-name,
        .hljs-regexp,
        .hljs-link,
        .hljs-selector-id,
        .hljs-selector-class {
          color: #d73a49;
        }
        .hljs-number,
        .hljs-meta,
        .hljs-built_in,
        .hljs-builtin-name,
        .hljs-literal,
        .hljs-type,
        .hljs-params {
          color: #005cc5;
        }
        .hljs-string,
        .hljs-symbol,
        .hljs-bullet {
          color: #032f62;
        }
        .hljs-title,
        .hljs-section {
          color: #6f42c1;
        }
        .hljs-keyword,
        .hljs-selector-tag {
          color: #d73a49;
        }
        .dark .hljs-comment,
        .dark .hljs-quote {
          color: #8b949e;
        }
        .dark .hljs-variable,
        .dark .hljs-template-variable,
        .dark .hljs-attribute,
        .dark .hljs-tag,
        .dark .hljs-name,
        .dark .hljs-regexp,
        .dark .hljs-link,
        .dark .hljs-selector-id,
        .dark .hljs-selector-class {
          color: #ff7b72;
        }
        .dark .hljs-number,
        .dark .hljs-meta,
        .dark .hljs-built_in,
        .dark .hljs-builtin-name,
        .dark .hljs-literal,
        .dark .hljs-type,
        .dark .hljs-params {
          color: #79c0ff;
        }
        .dark .hljs-string,
        .dark .hljs-symbol,
        .dark .hljs-bullet {
          color: #a5d6ff;
        }
        .dark .hljs-title,
        .dark .hljs-section {
          color: #d2a8ff;
        }
        .dark .hljs-keyword,
        .dark .hljs-selector-tag {
          color: #ff7b72;
        }
      `}</style>
    </div>
  );
}
