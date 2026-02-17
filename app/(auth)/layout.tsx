export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 px-4">
      <main className="w-full max-w-sm">{children}</main>
    </div>
  );
}
