import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Building2, 
  Users, 
  ShieldCheck,
  Activity
} from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/users", label: "Users", icon: Users },
  { href: "/roles", label: "Roles", icon: ShieldCheck },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck();

  return (
    <div className="min-h-screen flex bg-background w-full" dir="ltr">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col flex-shrink-0 border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="font-bold text-lg tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-xs">
              AM
            </div>
            Asset Manager
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border flex items-center justify-between text-xs text-sidebar-foreground/50">
          <span>Internal Tool</span>
          {health?.status === 'ok' ? (
            <span className="flex items-center gap-1 text-green-500" title="System Online"><Activity className="w-3 h-3" /> OK</span>
          ) : (
            <span className="flex items-center gap-1 text-red-500" title="System Offline"><Activity className="w-3 h-3" /> ERR</span>
          )}
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
