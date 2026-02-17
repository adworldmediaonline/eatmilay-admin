"use client";

import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeIcon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  QuoteIcon,
  MinusIcon,
  UndoIcon,
  RedoIcon,
  LinkIcon,
  UnlinkIcon,
  ImageIcon,
  TableIcon,
  VideoIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  HighlighterIcon,
  MaximizeIcon,
  MinimizeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToolbarProps = {
  editor: Editor | null;
  onLinkClick: () => void;
  onImageClick: () => void;
  onTableClick: () => void;
  onYoutubeClick?: () => void;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
  showCharCount?: boolean;
  charCount?: number;
  wordCount?: number;
};

function ToolbarButton({
  onClick,
  disabled,
  active,
  children,
  title,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "size-8",
        active && "bg-muted"
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );
}

export function EditorToolbar({
  editor,
  onLinkClick,
  onImageClick,
  onTableClick,
  onYoutubeClick,
  isFullscreen,
  onFullscreenToggle,
  showCharCount,
  charCount = 0,
  wordCount = 0,
}: ToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-2">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <BoldIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <ItalicIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline"
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <StrikethroughIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Inline code"
      >
        <CodeIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        disabled={!editor.can().chain().focus().toggleHighlight().run()}
        active={editor.isActive("highlight")}
        title="Highlight"
      >
        <HighlighterIcon className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "size-8",
              (editor.isActive("heading", { level: 1 }) ||
                editor.isActive("heading", { level: 2 }) ||
                editor.isActive("heading", { level: 3 })) &&
                "bg-muted"
            )}
            title="Headings"
          >
            <Heading1Icon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1Icon className="mr-2 size-4" />
            Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2Icon className="mr-2 size-4" />
            Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3Icon className="mr-2 size-4" />
            Heading 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        disabled={!editor.can().chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <QuoteIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        title="Code block"
      >
        <CodeIcon className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <ListIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Ordered list"
      >
        <ListOrderedIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive("taskList")}
        title="Task list"
      >
        <ListTodoIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal rule"
      >
        <MinusIcon className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Links & Media */}
      <ToolbarButton
        onClick={onLinkClick}
        active={editor.isActive("link")}
        title="Insert link"
      >
        <LinkIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive("link")}
        title="Remove link"
      >
        <UnlinkIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onImageClick} title="Insert image">
        <ImageIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onTableClick} title="Insert table">
        <TableIcon className="size-4" />
      </ToolbarButton>
      {onYoutubeClick && (
        <ToolbarButton onClick={onYoutubeClick} title="Insert YouTube video">
          <VideoIcon className="size-4" />
        </ToolbarButton>
      )}

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        title="Undo"
      >
        <UndoIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        title="Redo"
      >
        <RedoIcon className="size-4" />
      </ToolbarButton>

      {onFullscreenToggle && (
        <>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <ToolbarButton
            onClick={onFullscreenToggle}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <MinimizeIcon className="size-4" />
            ) : (
              <MaximizeIcon className="size-4" />
            )}
          </ToolbarButton>
        </>
      )}

      {showCharCount && (
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>{wordCount} words</span>
          <span>·</span>
          <span>{charCount} chars</span>
        </div>
      )}
    </div>
  );
}
