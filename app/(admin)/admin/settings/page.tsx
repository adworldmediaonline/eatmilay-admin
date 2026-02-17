"use client";

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-lg font-semibold">Admin Settings</h2>
          <p className="text-muted-foreground text-sm">
            System and application settings
          </p>
        </div>
        <div className="px-4 lg:px-6">
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p className="text-sm">
              Settings content. Configure system-wide preferences and options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
