import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Sprout,
  Package,
  Stethoscope,
  CalendarClock,
  MessageSquareHeart,
  Settings,
  Box,
  BarChart3,
  Landmark,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  children?: { label: string; href: string }[];
}

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    label: "Farmers",
    href: "/admin/farmers",
    icon: Users,
    children: [
      { label: "All Farmers", href: "/admin/farmers" },
      { label: "Add Farmer", href: "/admin/farmers/new" },
    ],
  },
  {
    label: "Crops",
    href: "/admin/crops",
    icon: Sprout,
    children: [
      { label: "Active Crops", href: "/admin/crops?status=active" },
      { label: "All Crops", href: "/admin/crops" },
      { label: "Add Crop", href: "/admin/crops/new" },
    ],
  },
  { label: "Products", href: "/admin/products", icon: Package },
  {
    label: "Treatments",
    href: "/admin/treatments",
    icon: Stethoscope,
  },
  {
    label: "Follow-ups",
    href: "/admin/followups",
    icon: CalendarClock,
  },
  { label: "Feedback", href: "/admin/feedback", icon: MessageSquareHeart },
  { label: "Digital Farm", href: "/admin/farm-3d", icon: Box, comingSoon: true },
  { label: "Reports", href: "/admin/reports", icon: BarChart3, comingSoon: true },
  {
    label: "Settings",
    href: "/admin/settings/crop-stages",
    icon: Settings,
  },
];

export const FARMER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/farmer/dashboard", icon: LayoutDashboard },
  { label: "My Crops", href: "/farmer/crops", icon: Sprout },
  { label: "My Farm", href: "/farmer/profile", icon: Landmark },
  { label: "Follow-ups", href: "/farmer/followups", icon: CalendarClock },
  { label: "Feedback", href: "/farmer/feedback", icon: MessageSquareHeart },
];
