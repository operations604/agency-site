import type { ReactNode } from "react";

export default function PreviewCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`hairline soft-shadow-lg rounded-2xl bg-white overflow-hidden ${className}`}
    >
      <div className="relative">{children}</div>
    </div>
  );
}
