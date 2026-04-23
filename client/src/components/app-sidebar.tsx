import { useLocation, Link } from "wouter";
import { OQLogo } from "@/components/oq-logo";
import { LayoutDashboard, BookOpen, ClipboardCheck, BarChart3, GraduationCap, LogOut, Sun, Moon, Settings, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Classes", url: "/classes", icon: BookOpen },
  { title: "Learn", url: "/learn", icon: GraduationCap },
  { title: "Practice", url: "/practice", icon: ClipboardCheck },
  { title: "Progress", url: "/progress", icon: BarChart3 },
  { title: "Cheat Sheet", url: "/cheat-sheet", icon: FileText },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <OQLogo size={40} />
          <div className="flex flex-col">
            <span className="text-sm font-bold font-mono tracking-tight" data-testid="text-app-name">OnQuest</span>
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.12em]">Exam Prep</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono uppercase tracking-[0.15em]">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className={isActive
                        ? "text-[#FFD400] bg-sidebar-accent font-semibold border-l-2 border-[#FFD400] rounded-l-none"
                        : "font-medium"
                      }
                    >
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-mono uppercase tracking-[0.15em]">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    data-active={location === "/admin"}
                    className={location === "/admin"
                      ? "text-[#FFD400] bg-sidebar-accent font-semibold border-l-2 border-[#FFD400] rounded-l-none"
                      : "font-medium"
                    }
                  >
                    <Link href="/admin" data-testid="link-nav-admin">
                      <Settings className="w-4 h-4" />
                      <span>Content Manager</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 border-2 border-sidebar-border">
            <AvatarFallback className="bg-primary/20 text-sm font-mono font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold truncate" data-testid="text-user-name">{user?.displayName}</span>
            <span className="text-[11px] text-muted-foreground truncate font-mono">{user?.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
