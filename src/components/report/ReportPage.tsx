import React from "react";
export function ReportPage({
  title,
  subtitle,
  rightMeta,
  children,
}: {
  title: string;
  subtitle?: string;
  rightMeta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="report-page report-shell">
      <header className="report-header">
        <div>
          <div className="report-brand">LOOMA PRO</div>
          <h2 className="report-title">{title}</h2>
          {subtitle ? <div className="report-subtitle">{subtitle}</div> : null}
        </div>
        <div className="report-meta">{rightMeta}</div>
      </header>

      <div className="report-body">{children}</div>

      <footer className="report-footer">
        <div>LOOMA Pro | Cognitive Fitness for Elite Minds</div>
        <div className="report-pagehint">Confidential</div>
      </footer>
    </section>
  );
}
