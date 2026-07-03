import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Building2, 
  Users, 
  ShieldCheck,
  Activity,
  FileText
} from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { href: "/", label: "داشبۆرد", icon: LayoutDashboard },
  { href: "/assets", label: "کەرەستەکان", icon: Package },
  { href: "/documents", label: "نوسراوەکان", icon: FileText },
  { href: "/departments", label: "هۆبەکان", icon: Building2 },
  { href: "/users", label: "فەرمانبەران", icon: Users },
  { href: "/roles", label: "ئەرکەکان", icon: ShieldCheck },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck();

  return (
    <div className="min-h-screen flex bg-background w-full" dir="rtl">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col flex-shrink-0 border-l border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="font-bold text-lg tracking-tight flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-xs font-bold">
              ئ
            </div>
            ئی-ڕێکار
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
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border flex items-center justify-between text-xs text-sidebar-foreground/50">
          <span>ئامرازی ناوخۆیی</span>
          {health?.status === 'ok' ? (
            <span className="flex items-center gap-1 text-green-500" title="سیستەم سەرهەڵداوە"><Activity className="w-3 h-3" /> باشە</span>
          ) : (
            <span className="flex items-center gap-1 text-red-500" title="سیستەم کار ناکات"><Activity className="w-3 h-3" /> هەڵە</span>
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
