"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { importProducts, type ImportProductsResult } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, DownloadIcon, UploadIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

const TEMPLATE_CSV = `name,price,shortDescription,sku,categoryName,status,tags,compareAtPrice,currency,vendor,stockQuantity
Sample Product 1,19.99,Brief product description,SKU-001,Category Name,draft,tag1; tag2,24.99,USD,Vendor Inc,100
Sample Product 2,29.50,Another product description,SKU-002,,published,,,USD,,50`;

function downloadTemplate(): void {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "product-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProductImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportProductsResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((f: File | null) => {
    setFile(f);
    setResult(null);
    if (f && !f.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file");
      setFile(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      handleFile(f ?? null);
      e.target.value = "";
    },
    [handleFile]
  );

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const content = await file.text();
      const data = await importProducts(content);
      setResult(data);
      if (data.created > 0) {
        toast.success(`${data.created} product(s) imported`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} row(s) failed`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Import Products</h1>
          <p className="text-muted-foreground text-sm">
            Upload a CSV file to create products in bulk
          </p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-medium">CSV Format</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Required columns: <code className="rounded bg-muted px-1">name</code>,{" "}
            <code className="rounded bg-muted px-1">price</code>. Optional: slug,
            shortDescription, description, sku, categoryId, categoryName, status
            (draft|published), tags (semicolon-separated), compareAtPrice,
            currency, vendor, stockQuantity.
          </p>
          <Button variant="outline" onClick={downloadTemplate}>
            <DownloadIcon className="size-4" />
            Download template
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-medium">Upload CSV</h2>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleInputChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="flex cursor-pointer flex-col items-center gap-2"
            >
              <UploadIcon className="size-10 text-muted-foreground" />
              <span className="text-sm font-medium">
                {file ? file.name : "Drop CSV here or click to browse"}
              </span>
              <span className="text-muted-foreground text-xs">
                Only .csv files are accepted
              </span>
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import products"
              )}
            </Button>
            {(file || result) && (
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
        </div>

        {result && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-medium">Import Results</h2>
            <div className="mb-4 flex gap-4 text-sm">
              <span className="text-green-600 dark:text-green-400">
                Created: {result.created}
              </span>
              <span className="text-destructive">
                Failed: {result.failed}
              </span>
              <span className="text-muted-foreground">
                Total: {result.total}
              </span>
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">Row</th>
                      <th className="px-3 py-2 text-left font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-2">{e.row}</td>
                        <td className="px-3 py-2 text-destructive">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {result.created > 0 && (
              <Button asChild className="mt-4">
                <Link href="/admin/products">View products</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
