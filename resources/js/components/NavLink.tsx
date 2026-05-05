import type { InertiaLinkProps } from "@inertiajs/react";
import { Link } from "@inertiajs/react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps extends InertiaLinkProps {
  active?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, active, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        className={cn(
          "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none",
          active
            ? "border-indigo-400 text-gray-900 focus:border-indigo-700"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:text-gray-700 focus:border-gray-300",
          className
        )}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
