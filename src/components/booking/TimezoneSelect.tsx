import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Globe, Search } from "lucide-react";
import { listTimeZones, zoneOffsetLabel } from "../../lib/tz";

function pretty(zone: string): string {
  return zone.replace(/_/g, " ");
}

type Props = {
  value: string;
  onChange: (zone: string) => void;
};

/**
 * Searchable timezone override. Native <select> cannot be filtered, and the
 * IANA list runs to several hundred entries, so this is a combobox over a
 * listbox with type-to-filter.
 */
export default function TimezoneSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;

  const zones = useMemo(() => listTimeZones(), []);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, "_");
    const pool = q ? zones.filter((z) => z.toLowerCase().includes(q)) : zones;
    // Cap the rendered list: hundreds of live DOM nodes for a control most
    // visitors never touch is not worth the paint.
    return pool.slice(0, 120);
  }, [zones, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const index = Math.max(
      0,
      matches.findIndex((z) => z === value),
    );
    setActiveIndex(index);
    // Only when the panel opens; matches change as the visitor types.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`#${CSS.escape(optionId(activeIndex))}`)
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  const close = (refocus: boolean) => {
    setOpen(false);
    setQuery("");
    if (refocus) triggerRef.current?.focus();
  };

  const commit = (zone: string) => {
    onChange(zone);
    close(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(matches.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const zone = matches[activeIndex];
      if (zone) commit(zone);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "Tab") {
      close(false);
    }
  };

  const offset = zoneOffsetLabel(value);

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Times shown in ${pretty(value)}. Change timezone`}
        className="booking-timezone inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2 py-1 text-[14px] text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Globe size={15} aria-hidden />
        <span>
          Times shown in{" "}
          <span className="font-medium text-foreground">{pretty(value)}</span>
          {offset && <span className="font-mono"> · {offset}</span>}
        </span>
        <ChevronDown size={14} aria-hidden />
      </button>

      {open && (
        <div className="liquid-glass-menu absolute bottom-full left-0 z-30 mb-2 w-[290px] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search size={14} className="shrink-0 text-muted-foreground" aria-hidden />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                matches.length ? optionId(activeIndex) : undefined
              }
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search timezones"
              aria-label="Search timezones"
              className="w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Timezone"
            className="max-h-[220px] overflow-y-auto py-1"
          >
            {matches.length === 0 && (
              <li className="px-3 py-2 text-[14px] text-muted-foreground">
                No timezone matches that.
              </li>
            )}
            {matches.map((zone, i) => (
              <li
                key={zone}
                id={optionId(i)}
                role="option"
                aria-selected={zone === value}
                onClick={() => commit(zone)}
                onMouseMove={() => setActiveIndex(i)}
                className={`cursor-pointer px-3 py-1.5 text-[14px] transition-colors ${
                  i === activeIndex
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
                } ${zone === value ? "font-semibold text-foreground" : ""}`}
              >
                {pretty(zone)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
