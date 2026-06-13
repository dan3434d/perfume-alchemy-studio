import { Link } from "@tanstack/react-router";
import { ShoppingBag, User, Menu, X, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-[var(--amber-deep)] hover:underline">Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-1">
          <Link to="/shop" aria-label="Search" className="hidden sm:inline-flex p-2 rounded-full hover:bg-secondary">
            <Search className="w-5 h-5" />
          </Link>
          <Link to={user ? "/account" : "/auth"} aria-label="Account" className="p-2 rounded-full hover:bg-secondary">
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
            {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium text-[var(--amber-deep)]">Admin Dashboard</Link>}
          </nav>
        </div>
      )}
    </header>
  );
}
