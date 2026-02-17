"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LinkDialogProps = {
  open: boolean;
  initialUrl?: string;
  initialTitle?: string;
  onConfirm: (url: string, title?: string) => void;
  onCancel: () => void;
};

export function LinkDialog({
  open,
  initialUrl = "",
  initialTitle = "",
  onConfirm,
  onCancel,
}: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    setUrl(initialUrl);
    setTitle(initialTitle);
  }, [initialUrl, initialTitle, open]);

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (trimmed) {
      const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
      onConfirm(withProtocol, title.trim() || undefined);
    }
    onCancel();
  };

  if (!open) return null;

  return (
    <div className="flex flex-col gap-2 p-2 border-b border-border bg-muted/50">
      <div className="flex flex-col gap-2">
        <div className="space-y-2">
          <Label htmlFor="link-url">URL</Label>
          <Input
            id="link-url"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="h-9"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="link-title">Title (optional)</Label>
          <Input
            id="link-title"
            type="text"
            placeholder="Link text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="h-9"
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={!url.trim()} onClick={handleSubmit}>
            Apply
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
