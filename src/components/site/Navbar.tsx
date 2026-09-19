import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, User, Menu, X, Search, LogOut, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SearchOverlay } from "@/components/site/SearchOverlay";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/scent-discovery", label: "Scent Quiz" },
  { to: "/about", label: "Our Story" },
  { to: "/contact", label: "Contact" },
];

const linkClass =
  "relative text-[13px] font-medium uppercase tracking-[0.08em] text-foreground/75 hover:text-foreground transition-colors after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-foreground after:transition-all hover:after:w-full";

export function Navbar() {
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const brands = useQuery({
    queryKey: ["brands", "nav"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("inspired_by_brand")
        .eq("is_active", true)
        .not("inspired_by_brand", "is", null);
      const set = new Set<string>();
      (data || []).forEach((r: any) => r.inspired_by_brand && set.add(r.inspired_by_brand));
      return Array.from(set).sort();
    },
    staleTime: 5 * 60 * 1000,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/" });
  };

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border bg-background transition-shadow ${
        scrolled ? "shadow-[0_1px_12px_rgba(0,0,0,0.06)]" : ""
      }`}
    >
      <div className="container-px max-w-7xl mx-auto h-16 flex items-center justify-between gap-6">
        {/* Wordmark — plain type, no badge */}
        <Link to="/" aria-label="Abdulrahman Perfumes — home" className="shrink-0">
          <span className="font-display text-[22px] leading-none tracking-tight">
            Abdulrahman
          </span>
          <span className="ml-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Perfumes
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={linkClass}
              activeProps={{ className: `${linkClass} text-foreground after:w-full` }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
          <div
            className="relative"
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <button
              onClick={() => setCatOpen((o) => !o)}
              className={`${linkClass} inline-flex items-center gap-1`}
            >
              Brands <ChevronDown className={`w-3.5 h-3.5 transition-transform ${catOpen ? "rotate-180" : ""}`} />
            </button>
            {catOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-60">
                <div className="border border-border bg-popover py-1.5 text-sm">
                  <Link
                    to="/shop"
                    onClick={() => setCatOpen(false)}
                    className="block px-5 py-2.5 hover:bg-secondary font-medium"
                  >
                    All brands
                  </Link>
                  <div className="my-1 h-px bg-border" />
                  {brands.data?.map((b) => (
                    <Link
                      key={b}
                      to="/shop"
                      search={{ brand: b }}
                      onClick={() => setCatOpen(false)}
                      className="block px-5 py-2.5 hover:bg-secondary text-foreground/80 hover:text-foreground"
                    >
                      {b}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          {isAdmin && (
            <Link to="/admin" className={`${linkClass} text-[var(--amber-deep)]`}>
              Admin
            </Link>
          )}
        </nav>

        {/* Icons — plain, opacity hover like a Shopify storefront */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search products"
            className="inline-flex p-2 hover:opacity-60 transition-opacity"
          >
            <Search className="w-[19px] h-[19px]" strokeWidth={1.75} />
          </button>
          <Link
            to={isAdmin ? "/admin" : user ? "/account" : "/auth"}
            aria-label="Account"
            className="p-2 hover:opacity-60 transition-opacity"
          >
            <User className="w-[19px] h-[19px]" strokeWidth={1.75} />
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative p-2 hover:opacity-60 transition-opacity">
            <ShoppingBag className="w-[19px] h-[19px]" strokeWidth={1.75} />
            {count > 0 && (
              <span className="absolute top-0 right-0 bg-foreground text-background text-[10px] font-semibold min-w-4 h-4 px-0.5 rounded-full grid place-items-center">
                {count}
              </span>
            )}
          </Link>
          {user && (
            <button
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="hidden sm:inline-flex p-2 hover:opacity-60 transition-opacity"
            >
              <LogOut className="w-[19px] h-[19px]" strokeWidth={1.75} />
            </button>
          )}
          <button
            className="md:hidden p-2 hover:opacity-60 transition-opacity"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — clean divided list */}
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container-px max-w-7xl mx-auto py-2 flex flex-col divide-y divide-border">
            <button
              onClick={() => { setOpen(false); setSearchOpen(true); }}
              className="py-3.5 flex items-center gap-2 text-left text-[13px] font-medium uppercase tracking-[0.08em]"
            >
              <Search className="w-4 h-4" strokeWidth={1.75} /> Search
            </button>
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-3.5 text-[13px] font-medium uppercase tracking-[0.08em]"
              >
                {n.label}
              </Link>
            ))}
            <div className="py-3.5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Shop by brand
              </div>
              {brands.data?.map((b) => (
                <Link
                  key={b}
                  to="/shop"
                  search={{ brand: b }}
                  onClick={() => setOpen(false)}
                  className="block py-2 text-sm text-foreground/80"
                >
                  {b}
                </Link>
              ))}
            </div>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] text-[var(--amber-deep)]"
              >
                Admin
              </Link>
            )}
            {user && (
              <button
                onClick={signOut}
                className="py-3.5 text-left text-[13px] font-medium uppercase tracking-[0.08em] text-destructive"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
