"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeIcon,
  LinkIcon,
  HighlighterIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BubbleMenuProps = {
  editor: Editor;
  onLinkClick: () => void;
};

export function EditorBubbleMenu({ editor, onLinkClick }: BubbleMenuProps) {
  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top" }}
      className="flex rounded-lg border border-border bg-background p-1 shadow-lg"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", editor.isActive("bold") && "bg-muted")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", editor.isActive("italic") && "bg-muted")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", editor.isActive("underline") && "bg-muted")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", editor.isActive("strike") && "bg-muted")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <StrikethroughIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", editor.isActive("code") && "bg-muted")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <CodeIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", editor.isActive("highlight") && "bg-muted")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <HighlighterIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", editor.isActive("link") && "bg-muted")}
        onClick={onLinkClick}
      >
        <LinkIcon className="size-4" />
      </Button>
    </BubbleMenu>
  );
}
