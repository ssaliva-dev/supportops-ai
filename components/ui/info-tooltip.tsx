import { cn } from "@/lib/utils/cn";

type InfoTooltipProps = {
  text: string;
  className?: string;
  iconClassName?: string;
  tooltipClassName?: string;
};

export function InfoTooltip({ text, className, iconClassName, tooltipClassName }: InfoTooltipProps) {
  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <button
        type="button"
        aria-label="What was built and why"
        className={cn(
          "peer inline-flex h-4 w-4 items-center justify-center rounded-full border border-sky-700 bg-sky-600 text-[10px] font-semibold text-white shadow-sm outline-none transition hover:bg-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500",
          iconClassName,
        )}
      >
        i
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-72 -translate-x-1/2 rounded-md border border-slate-200 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-100 opacity-0 shadow-lg transition-opacity duration-150 peer-hover:opacity-100 peer-focus-visible:opacity-100",
          tooltipClassName,
        )}
      >
        {text}
      </span>
    </span>
  );
}
