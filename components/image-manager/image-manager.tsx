"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { deleteImage, getUploadSignature } from "@/lib/api";
import type { ProductImage } from "@/lib/api";
import {
  GripVerticalIcon,
  ImagePlusIcon,
  PencilIcon,
  Trash2Icon,
  Loader2Icon,
  StarIcon,
} from "lucide-react";
import { toast } from "sonner";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1";

const PARALLEL_UPLOADS = 3;

const ACCEPTED_IMAGE_TYPES =
  "image/jpeg,image/jpg,image/png,image/avif,image/webp,image/gif,image/bmp,image/tiff,image/heic";

function uploadSingle(
  file: File,
  folder: string,
  onProgress: (pct: number) => void
): Promise<{ url: string; public_id: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      const { signature, timestamp, cloudName, apiKey, eager, use_filename, unique_filename } =
        await getUploadSignature(folder);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);
      if (eager) formData.append("eager", eager);
      if (use_filename) formData.append("use_filename", use_filename);
      if (unique_filename) formData.append("unique_filename", unique_filename);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (ev) => {
        if (ev.lengthComputable) {
          onProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            const url =
              data.eager?.[0]?.secure_url ?? data.secure_url;
            resolve({ url, public_id: data.public_id });
          } catch {
            reject(new Error("Invalid response"));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error?.message ?? "Upload failed"));
          } catch {
            reject(new Error("Upload failed"));
          }
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Upload failed")));
      xhr.open(
        "POST",
        `${CLOUDINARY_UPLOAD_URL}/${cloudName}/image/upload`
      );
      xhr.send(formData);
    } catch (err) {
      reject(err);
    }
  });
}

async function uploadInBatches(
  files: File[],
  folder: string,
  onBatchProgress: (index: number, pct: number) => void
): Promise<{ url: string; public_id: string; filename: string }[]> {
  const results: { url: string; public_id: string; filename: string }[] = [];
  const imageFiles = files.filter((f) => f.type.startsWith("image/"));

  for (let i = 0; i < imageFiles.length; i += PARALLEL_UPLOADS) {
    const batch = imageFiles.slice(i, i + PARALLEL_UPLOADS);
    const batchResults = await Promise.all(
      batch.map((file, j) =>
        uploadSingle(file, folder, (pct) =>
          onBatchProgress(i + j, pct)
        ).then((r) => ({
          url: r.url,
          public_id: r.public_id,
          filename: file.name,
        }))
      )
    );
    results.push(...batchResults);
  }
  return results;
}

type SortableImageProps = {
  img: ProductImage;
  index: number;
  isPrimary: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onSetPrimary: () => void;
  isDeleting?: boolean;
};

function SortableImage({
  img,
  index,
  isPrimary,
  onEdit,
  onRemove,
  onSetPrimary,
  isDeleting,
}: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.publicId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-square size-24 shrink-0 overflow-hidden rounded-lg border bg-muted ${
        isDragging ? "z-50 opacity-90 shadow-lg ring-2 ring-primary" : ""
      }`}
    >
      {isPrimary && (
        <div className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
          Primary
        </div>
      )}
      <Image
        src={img.url}
        alt={img.alt || img.title || "Product image"}
        fill
        className="object-cover"
        sizes="96px"
      />
      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="size-8 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVerticalIcon className="size-4" />
        </Button>
        {!isPrimary && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-8"
            onClick={onSetPrimary}
            title="Set as primary"
          >
            <StarIcon className="size-4" />
          </Button>
        )}
        <Button type="button" size="icon" variant="secondary" className="size-8" onClick={onEdit}>
          <PencilIcon className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="size-8"
          onClick={onRemove}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <Trash2Icon className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export type ImageManagerProps = {
  value: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  folder?: string;
  maxImages?: number;
  disabled?: boolean;
  /** Called after successful image deletion - use to persist changes (e.g. update product) */
  onPersistAfterDelete?: (images: ProductImage[]) => void | Promise<void>;
};

export function ImageManager({
  value,
  onChange,
  folder = "admin",
  maxImages = 10,
  disabled = false,
  onPersistAfterDelete,
}: ImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ filename: "", title: "", alt: "" });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleStartEdit = (index: number) => {
    const img = value[index];
    setEditForm({
      filename: img.filename ?? "",
      title: img.title ?? "",
      alt: img.alt ?? "",
    });
    setEditingIndex(index);
    setSheetOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const next = [...value];
    next[editingIndex] = {
      ...next[editingIndex],
      filename: editForm.filename || undefined,
      title: editForm.title || undefined,
      alt: editForm.alt || undefined,
    };
    onChange(next);
    setEditingIndex(null);
    setSheetOpen(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.findIndex((i) => i.publicId === active.id);
    const newIndex = value.findIndex((i) => i.publicId === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onChange(arrayMove(value, oldIndex, newIndex));
    }
  };

  const processFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || disabled || value.length >= maxImages) return;

      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArray.length === 0) {
        toast.error("Please select image files");
        return;
      }

      const remaining = maxImages - value.length;
      const toUpload = fileArray.slice(0, remaining);
      if (toUpload.length < fileArray.length) {
        toast.info(`Uploading ${toUpload.length} of ${fileArray.length} (max ${maxImages} images)`);
      }

      setUploading(true);
      setUploadProgress({});

      try {
        const uploaded = await uploadInBatches(
          toUpload,
          folder,
          (index, pct) => {
            setUploadProgress((prev) => ({ ...prev, [index]: pct }));
          }
        );

        const newImages: ProductImage[] = uploaded.map((u) => ({
          url: u.url,
          publicId: u.public_id,
          filename: u.filename,
          title: "",
          alt: "",
        }));

        onChange([...value, ...newImages]);
        toast.success(
          uploaded.length === 1 ? "Image uploaded" : `${uploaded.length} images uploaded`
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        setUploadProgress({});
      }
    },
    [value, onChange, folder, maxImages, disabled]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      e.target.value = "";
    },
    [processFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleRemove = async (index: number) => {
    const img = value[index];
    if (!img?.publicId) return;
    setDeletingId(img.publicId);
    try {
      await deleteImage(img.publicId);
      const next = value.filter((_, i) => i !== index);
      onChange(next);
      if (editingIndex === index) {
        setEditingIndex(null);
        setSheetOpen(false);
      } else if (editingIndex !== null && editingIndex > index) {
        setEditingIndex(editingIndex - 1);
      }
      await onPersistAfterDelete?.(next);
      toast.success("Image removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove image");
    } finally {
      setDeletingId(null);
    }
  };

  const canAddMore = value.length < maxImages && !disabled;
  const uploadProgressValues = Object.values(uploadProgress);
  const totalUploading = uploadProgressValues.length;
  const avgProgress =
    totalUploading > 0
      ? Math.round(
          uploadProgressValues.reduce((a, b) => a + b, 0) / totalUploading
        )
      : 0;

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={value.map((i) => i.publicId)} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-4">
            {value.map((img, index) => (
              <SortableImage
                key={img.publicId}
                img={img}
                index={index}
                isPrimary={index === 0}
                onEdit={() => handleStartEdit(index)}
                onRemove={() => handleRemove(index)}
                onSetPrimary={() => onChange(arrayMove(value, index, 0))}
                isDeleting={deletingId === img.publicId}
              />
            ))}

            {canAddMore && (
              <label
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative flex aspect-square size-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-colors ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
                } ${uploading ? "pointer-events-none cursor-not-allowed" : ""}`}
              >
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  multiple
                  className="sr-only"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                {uploading ? (
                  <>
                    <Loader2Icon className="size-6 animate-spin" />
                    <span className="text-xs">
                      {totalUploading > 1 ? `${avgProgress}%` : `${uploadProgress[0] ?? 0}%`}
                    </span>
                    {totalUploading > 1 && (
                      <span className="text-muted-foreground text-xs">
                        {totalUploading} uploading
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <ImagePlusIcon className="size-6 text-muted-foreground" />
                    <span className="text-center text-xs text-muted-foreground">
                      Drop or click
                    </span>
                  </>
                )}
              </label>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit image</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                value={editForm.filename}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, filename: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt">Alt text</Label>
              <Input
                id="alt"
                value={editForm.alt}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, alt: e.target.value }))
                }
              />
            </div>
            <Button onClick={handleSaveEdit} className="w-full">
              Save
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      {value.length > 0 && (
        <p className="text-muted-foreground text-sm">
          {value.length} / {maxImages} images. Drag to reorder · hover to edit or remove.
        </p>
      )}
    </div>
  );
}
