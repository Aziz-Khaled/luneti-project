import type { ReactNode } from "react";

export function DataView({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <p className="muted">Aucune donnée trouvée.</p>;
  const rows = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.data)
      ? value.data
      : null;
  if (!rows) return <pre className="json-view">{JSON.stringify(value, null, 2)}</pre>;
  if (rows.length === 0) return <p className="muted">Aucune donnée trouvée.</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{Object.keys(asRecord(rows[0])).map((key) => <th key={key}>{humanize(key)}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getId(row) ?? index}>
              {Object.values(asRecord(row)).map((item, cell) => (
                <td key={cell}>{renderCell(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {isRecord(value) && Boolean(value.meta) && <p className="muted">{JSON.stringify(value.meta)}</p>}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div><h2>{title}</h2>{description && <p className="muted">{description}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Notice({
  kind = "info",
  children,
}: {
  kind?: "info" | "error" | "success";
  children: ReactNode;
}) {
  return <div className={`notice ${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : { value };
}

function getId(value: unknown): string | undefined {
  const id = asRecord(value).id;
  return typeof id === "string" ? id : undefined;
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function renderCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
  ) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString();
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
