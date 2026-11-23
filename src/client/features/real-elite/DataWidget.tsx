import type { ReactNode } from "react";

export function DataWidget({
  title,
  source,
  refreshedAt,
  empty,
  note,
  children,
}: {
  title: string;
  source: string;
  refreshedAt: string | null;
  empty?: boolean;
  note?: string | null;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="mt-3 text-sm">
        {empty ? <p>No data</p> : children}
        {empty && note ? (
          <p className="mt-2 text-muted-foreground">{note}</p>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Source: {source}</p>
      <p className="text-xs text-muted-foreground">
        Last refreshed: {refreshedAt ?? "No data"}
      </p>
    </section>
  );
}

export function PlannedPaid({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Planned (paid)
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
        <p className="mt-4 text-sm">This screen does not call the paid API.</p>
      </div>
    </div>
  );
}
