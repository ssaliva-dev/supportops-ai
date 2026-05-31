import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { InfoTooltip } from "@/components/ui/info-tooltip";

type TitleWithInfoProps = {
  as?: "h1" | "h2" | "h3";
  title: ReactNode;
  info: string;
  className?: string;
  wrapperClassName?: string;
  infoIconClassName?: string;
  infoTooltipClassName?: string;
};

export function TitleWithInfo({
  as = "h2",
  title,
  info,
  className,
  wrapperClassName,
  infoIconClassName,
  infoTooltipClassName,
}: TitleWithInfoProps) {
  const HeadingTag = as;

  return (
    <div className={cn("flex items-center gap-2", wrapperClassName)}>
      <HeadingTag className={className}>{title}</HeadingTag>
      <InfoTooltip text={info} iconClassName={infoIconClassName} tooltipClassName={infoTooltipClassName} />
    </div>
  );
}
