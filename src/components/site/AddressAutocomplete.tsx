import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

type Suggestion = {
  display: string;
  line1: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: Suggestion) => void;
  placeholder?: string;
  required?: boolean;
};

// Free Australian address autocomplete via OpenStreetMap Nominatim.
// No API key required. Debounced and country-restricted to AU.
export function AddressAutocomplete({ value, onChange, onSelect, placeholder, required }: Props) {
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const timer = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!value || value.length < 3) {
      setResults([]);
      return;
    }
    timer.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=au&limit=6&q=${encodeURIComponent(
          value,
        )}`;
        const res = await fetch(url, { headers: { "Accept-Language": "en-AU" } });
        const data = await res.json();
        const stateAbbr: Record<string, string> = {
          "New South Wales": "NSW",
          "Victoria": "VIC",
          "Queensland": "QLD",
          "Western Australia": "WA",
          "South Australia": "SA",
          "Tasmania": "TAS",
          "Australian Capital Territory": "ACT",
          "Northern Territory": "NT",
        };
        const list: Suggestion[] = (data as any[])
          .map((d) => {
            const a = d.address || {};
            const houseNumber = a.house_number ?? "";
            const road = a.road ?? a.pedestrian ?? a.footway ?? "";
            const line1 = [houseNumber, road].filter(Boolean).join(" ").trim();
            const city = a.suburb ?? a.city ?? a.town ?? a.village ?? a.hamlet ?? "";
            const state = stateAbbr[a.state] ?? a.state ?? "";
            const postcode = a.postcode ?? "";
            return {
              display: d.display_name as string,
              line1: line1 || (d.display_name as string).split(",")[0],
              city,
              state,
              postcode,
              country: "Australia",
            };
          })
          .filter((s) => s.line1);
        setResults(list);
        setOpen(true);
        setActive(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value]);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || results.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const s = results[active];
              if (s) {
                onSelect(s);
                setOpen(false);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder ?? "Start typing your address…"}
          className="w-full rounded-xl border border-border bg-background pl-10 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full max-h-72 overflow-auto rounded-xl border border-border bg-popover shadow-lg text-sm">
          {results.map((r, i) => (
            <li
              key={r.display}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(r);
                setOpen(false);
              }}
              onMouseEnter={() => setActive(i)}
              className={`px-3 py-2 cursor-pointer ${i === active ? "bg-secondary" : ""}`}
            >
              <div className="font-medium truncate">{r.line1}{r.city ? `, ${r.city}` : ""}</div>
              <div className="text-xs text-muted-foreground truncate">
                {[r.city, r.state, r.postcode].filter(Boolean).join(" · ")}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-[11px] text-muted-foreground">Australian addresses · powered by OpenStreetMap</p>
    </div>
  );
}
