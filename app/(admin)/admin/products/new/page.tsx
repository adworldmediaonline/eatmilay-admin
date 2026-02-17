"use client";

import { Suspense } from "react";
import { ProductFormWizard } from "@/components/product-form-wizard";

export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ProductFormWizard mode="create" />
    </Suspense>
  );
}
