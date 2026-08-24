export function ComingSoon({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This module is scheduled for {phase} and isn&apos;t built yet.
      </p>
    </div>
  );
}
