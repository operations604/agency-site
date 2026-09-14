import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Renders children at a designed pixel size, then scales the whole frame to
 *  the container width. Desktop UI stays intact; the phone just zooms it. */
export default function ScaleFrame({
  width,
  height,
  children,
  className = "",
}: {
  width: number;
  height: number;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const next = el.clientWidth / width;
      setScale(Number.isFinite(next) && next > 0 ? next : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ height: height * scale, overflow: "hidden" }}
    >
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
