export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-600">
      {message}
    </div>
  );
}
