"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

type YoutubeDialogProps = {
  open: boolean;
  onInsert: (videoId: string) => void;
  onCancel: () => void;
};

export function EditorYoutubeDialog({
  open,
  onInsert,
  onCancel,
}: YoutubeDialogProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = () => {
    const trimmed = url.trim();
    const id = extractYoutubeId(trimmed);
    if (id) {
      const src = trimmed.startsWith("http") ? trimmed : `https://www.youtube.com/watch?v=${id}`;
      onInsert(src);
      setUrl("");
    }
  };

  if (!open) return null;

  return (
    <div className="flex flex-col gap-3 p-3 border-b border-border bg-muted/50">
      <div className="space-y-2">
        <Label htmlFor="youtube-url">YouTube URL</Label>
        <div className="flex gap-2">
          <Input
            id="youtube-url"
            type="text"
            placeholder="https://youtube.com/watch?v=... or video ID"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="h-9"
          />
          <Button type="button" size="sm" disabled={!url.trim()} onClick={handleSubmit}>
            Insert
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste a YouTube URL or video ID
        </p>
      </div>
    </div>
  );
}
