import { cn } from "@/lib/utils";

export function TrafficLights({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="size-3 rounded-full bg-[#ff5f57] ring-1 ring-black/10 ring-inset" />
      <span className="size-3 rounded-full bg-[#febc2e] ring-1 ring-black/10 ring-inset" />
      <span className="size-3 rounded-full bg-[#28c840] ring-1 ring-black/10 ring-inset" />
    </div>
  );
}

export function MacWindow({
  title,
  toolbar,
  children,
  className,
}: {
  title?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-2xl",
        className
      )}
    >
      {/* Title bar */}
      <div className="relative flex h-11 shrink-0 items-center gap-3 border-b bg-muted/40 px-4">
        <TrafficLights />
        {title && (
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground">
            {title}
          </div>
        )}
        {toolbar && <div className="ml-auto flex items-center gap-1.5">{toolbar}</div>}
      </div>
      {children}
    </div>
  );
}
