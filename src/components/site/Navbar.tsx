import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, User, Menu, X, Search, LogOut, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/scent-discovery", label: "Scent Quiz" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    <header className={`sticky top-0 z-50 transition-all ${scrolled ? "bg-background/85 backdrop-blur-md border-b border-border" : "bg-background"}`}>
      <div className="container-px max-w-7xl mx-auto h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-display text-xl tracking-tight">
            Abdulrahman <span className="text-[var(--gold)]">Perfumes</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
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
              className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Shop by brand <ChevronDown className={`w-3.5 h-3.5 transition-transform ${catOpen ? "rotate-180" : ""}`} />
            </button>
            {catOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-64">
                <div className="rounded-xl border border-border bg-popover shadow-xl py-2 text-sm max-h-[70vh] overflow-auto">
                  <Link
                    to="/shop"
                    onClick={() => setCatOpen(false)}
                    className="block px-4 py-2 hover:bg-secondary font-medium"
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
                      className="block px-4 py-2 hover:bg-secondary"
                    >
                      {b}<span className="text-muted-foreground"> inspired</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-[var(--amber-deep)] hover:underline">Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-1">
          <Link to="/shop" aria-label="Search" className="hidden sm:inline-flex p-2 rounded-full hover:bg-secondary">
            <Search className="w-5 h-5" />
          </Link>
          <Link to={isAdmin ? "/admin" : user ? "/account" : "/auth"} aria-label="Account" className="p-2 rounded-full hover:bg-secondary">
            <User className="w-5 h-5" />
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative p-2 rounded-full hover:bg-secondary">
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[var(--gold)] text-primary-foreground text-[10px] font-semibold w-4 h-4 rounded-full grid place-items-center">
                {count}
              </span>
            )}
          </Link>
          {user && (
            <button
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="hidden sm:inline-flex p-2 rounded-full hover:bg-secondary"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
          <button
            className="md:hidden p-2 rounded-full hover:bg-secondary"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container-px max-w-7xl mx-auto py-4 flex flex-col gap-1">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium">
                {n.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-border">
              <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Shop by brand</div>
              {brands.data?.map((b) => (
                <Link
                  key={b}
                  to="/shop"
                  search={{ brand: b }}
                  onClick={() => setOpen(false)}
                  className="block py-2 text-sm"
                >
                  {b} <span className="text-muted-foreground">inspired</span>
                </Link>
              ))}
            </div>

            {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium text-[var(--amber-deep)]">Admin Dashboard</Link>}
            {user && (
              <button onClick={signOut} className="py-2.5 text-left text-sm font-medium text-destructive">
                Sign out
              </button>
            )}
          </nav>
        </div>
      )}

    </header>
  );
}

