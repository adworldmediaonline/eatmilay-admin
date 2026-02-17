import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Blockquote from "@tiptap/extension-blockquote";
import Heading from "@tiptap/extension-heading";
import BubbleMenu from "@tiptap/extension-bubble-menu";
import Youtube from "@tiptap/extension-youtube";
import { createLowlight, common } from "lowlight";

export function createEditorExtensions(placeholder: string) {
  return [
    StarterKit.configure({
      codeBlock: false,
      heading: false,
      blockquote: false,
      horizontalRule: false,
    }),
    Placeholder.configure({ placeholder }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: "text-primary underline underline-offset-2" },
    }),
    Image.configure({
      HTMLAttributes: { class: "rounded-lg max-w-full h-auto" },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: { class: "border-collapse table w-full" },
    }),
    TableRow,
    TableHeader.configure({
      HTMLAttributes: { class: "border border-border bg-muted/50 p-2 font-medium" },
    }),
    TableCell.configure({
      HTMLAttributes: { class: "border border-border p-2" },
    }),
    TaskList.configure({
      HTMLAttributes: { class: "list-none pl-0 space-y-1" },
    }),
    TaskItem.configure({
      nested: true,
      HTMLAttributes: { class: "flex items-start gap-2" },
    }),
    HorizontalRule,
    CodeBlockLowlight.configure({
      lowlight: createLowlight(common),
      HTMLAttributes: { class: "bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto" },
    }),
    Underline,
    Strike,
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
      HTMLAttributes: { class: "bg-yellow-200 dark:bg-yellow-900/50 rounded px-0.5" },
    }),
    Subscript,
    Superscript,
    Blockquote.configure({
      HTMLAttributes: { class: "border-l-4 border-muted-foreground pl-4 italic" },
    }),
    Heading.configure({
      levels: [1, 2, 3],
    }),
    BubbleMenu,
    Youtube.configure({
      controls: true,
      nocookie: true,
      width: 640,
      height: 360,
      HTMLAttributes: { class: "rounded-lg my-2" },
    }),
  ];
}
