"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { getUploadSignature } from "@/lib/api";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1";

type ImageUploadProps = {
  open: boolean;
  onInsert: (url: string) => void;
  onCancel: () => void;
};

export function EditorImageUpload({
  open,
  onInsert,
  onCancel,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setUploading(true);
    setError(null);

    try {
      const { signature, timestamp, cloudName, apiKey, eager, use_filename, unique_filename } =
        await getUploadSignature("admin");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", "admin");
      if (eager) formData.append("eager", eager);
      if (use_filename) formData.append("use_filename", use_filename);
      if (unique_filename) formData.append("unique_filename", unique_filename);

      const res = await fetch(
        `${CLOUDINARY_UPLOAD_URL}/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? "Upload failed");
      }

      const data = await res.json();
      const imageUrl =
        data.eager?.[0]?.secure_url ?? data.secure_url;
      onInsert(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleUrlSubmit = () => {
    const trimmed = url.trim();
    if (trimmed) {
      const withProtocol = trimmed.startsWith("http")
        ? trimmed
        : `https://${trimmed}`;
      onInsert(withProtocol);
    }
  };

  if (!open) return null;

  return (
    <div className="flex flex-col gap-3 p-3 border-b border-border bg-muted/50">
      <div className="space-y-2">
        <Label>Upload image</Label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "Choose file"
            )}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-muted/50 px-2 text-muted-foreground">or</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="image-url">Image URL</Label>
        <div className="flex gap-2">
          <Input
            id="image-url"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUrlSubmit();
              }
            }}
            className="h-9"
          />
          <Button type="button" size="sm" disabled={!url.trim()} onClick={handleUrlSubmit}>
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
}
