import { Home, Inbox, Zap, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  {
    label: "STARRED",
    items: [],
  },
  {
    label: "HOME",
    items: [
      {
        title: "Today",
        icon: Zap,
      },
      {
        title: "Work",
        icon: User,
      },
      {
        title: "Personal",
        icon: Home,
      },
      {
        title: "Inbox",
        icon: Inbox,
      },
    ],
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r bg-[#f3f3f3]">
      <SidebarContent>
        {items.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-medium text-gray-500">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton className="w-full">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}