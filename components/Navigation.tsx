"use client";

/**
 * Admin Navigation Component
 *
 * Side navigation for admin dashboard with role-based menu items
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface NavigationProps {
  tenantId: string;
  userRole?: string;
}

export default function Navigation({ tenantId, userRole }: NavigationProps) {
  const pathname = usePathname();
  const { user } = useUser();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    {
      name: "Dashboard",
      href: `/${tenantId}/admin`,
      icon: "📊",
      roles: ["SUPER_ADMIN", "MANAGER", "VIEWER"],
    },
    {
      name: "Customers",
      href: `/${tenantId}/admin/customers`,
      icon: "👥",
      roles: ["SUPER_ADMIN", "MANAGER", "VIEWER"],
    },
    {
      name: "Users",
      href: `/${tenantId}/admin/users`,
      icon: "🔐",
      roles: ["SUPER_ADMIN"],
    },
    {
      name: "Settings",
      href: `/${tenantId}/admin/settings`,
      icon: "⚙️",
      roles: ["SUPER_ADMIN"],
    },
  ];

  // Filter nav items based on user role
  const visibleItems = navItems.filter((item) =>
    userRole ? item.roles.includes(userRole) : true
  );

  return (
    <nav className="bg-white shadow-sm border-r border-gray-200 h-full">
      {/* User Info */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {userRole?.replace("_", " ").toLowerCase() || "User"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="py-4">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Public Link */}
      <div className="absolute bottom-0 w-full border-t border-gray-200 p-4">
        <Link
          href={`/${tenantId}/add-customer`}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          target="_blank"
        >
          <span className="mr-2">🔗</span>
          Public Registration
        </Link>
      </div>
    </nav>
  );
}
