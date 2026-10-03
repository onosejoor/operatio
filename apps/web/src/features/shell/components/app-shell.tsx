"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  CalendarClock,
  Check,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  PanelTop,
  Settings2,
  ShieldAlert,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@operatio/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@operatio/ui/components/ui/dropdown-menu";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { LoaderDisplay } from "@operatio/ui/components/loader-display";
import { Separator } from "@operatio/ui/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@operatio/ui/components/ui/sidebar";
import { toast } from "@operatio/ui/components/ui/sonner";
import {
  useCurrentUser,
  useOrganizations,
} from "@app/features/auth/hooks/auth-queries";
import { useSignOutMutation } from "@app/features/auth/hooks/auth-mutations";
import { ApiError } from "@app/lib/api/client";

const primaryLinks = [
  { label: "Overview", path: "", icon: LayoutDashboard },
  { label: "Monitors", path: "/monitors", icon: Activity },
  { label: "Incidents", path: "/incidents", icon: ShieldAlert },
  { label: "Status pages", path: "/status-pages", icon: PanelTop },
];

const manageLinks = [
  { label: "Maintenance", path: "/maintenance", icon: CalendarClock },
  { label: "Settings", path: "/settings", icon: Settings2 },
];

const allLinks = [...primaryLinks, ...manageLinks];

function isActivePath(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

interface NavUserProps {
  name: string;
  email: string;
  settingsHref: string;
  isLoggingOut: boolean;
  onLogout: () => void;
}

function NavUser({
  name,
  email,
  settingsHref,
  isLoggingOut,
  onLogout,
}: NavUserProps) {
  const { isMobile } = useSidebar();
  const initials = getInitials(name);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {email}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href={settingsHref} />}>
              <Settings2 />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={isLoggingOut}
              onClick={onLogout}
            >
              <LogOut />
              {isLoggingOut ? "Signing out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

interface AppSidebarProps {
  pathname: string;
  orgSlug: string;
  organizations: Array<{ id: string; name: string; slug: string }>;
  organizationName: string;
  user: { name: string; email: string };
  isLoggingOut: boolean;
  onLogout: () => void;
}

function AppSidebar({
  pathname,
  orgSlug,
  organizations,
  organizationName,
  user,
  isLoggingOut,
  onLogout,
}: AppSidebarProps) {
  const dashboardPath = `/${encodeURIComponent(orgSlug)}/dashboard`;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={dashboardPath} />}
              tooltip="Operatio"
            >
              <Image
                src="/logo.svg"
                alt=""
                width={150}
                height={30}
                priority
                className="shrink-0 dark:invert object-contain"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Organizations</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton size="lg" tooltip={organizationName} />
                  }
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent font-semibold text-sidebar-accent-foreground">
                    {organizationName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left">
                    {organizationName}
                  </span>
                  <ChevronsUpDown className="ml-auto size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="min-w-56"
                  align="start"
                  sideOffset={6}
                >
                  {organizations.map((organization) => (
                    <DropdownMenuItem
                      key={organization.id}
                      render={
                        <Link
                          href={`/${encodeURIComponent(organization.slug)}/dashboard`}
                        />
                      }
                    >
                      <span className="truncate">{organization.name}</span>
                      {organization.slug === orgSlug && (
                        <Check className="ml-auto size-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu className="gap-2.5">
            {primaryLinks.map(({ label, path, icon: Icon }) => {
              const href = `${dashboardPath}${path}`;
              return (
                <SidebarMenuItem key={path || "overview"}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={
                      pathname === href ||
                      (path !== "" && pathname.startsWith(`${href}/`))
                    }
                    tooltip={label}
                  >
                    <Icon className="shrink-0 size-5" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarMenu className="gap-2.5">
            {manageLinks.map(({ label, path, icon: Icon }) => {
              const href = `${dashboardPath}${path}`;
              return (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={isActivePath(pathname, href)}
                    tooltip={label}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          name={user.name}
          email={user.email}
          settingsHref={`${dashboardPath}/settings`}
          isLoggingOut={isLoggingOut}
          onLogout={onLogout}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function AppShell({
  children,
  orgSlug,
}: {
  children: React.ReactNode;
  orgSlug: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const organizations = useOrganizations(!!user.data);
  const organization = organizations.data?.find(
    (item) => item.slug === orgSlug,
  );
  const firstOrganization = organizations.data?.[0];
  useEffect(() => {
    if (
      !organizations.isPending &&
      !organizations.isError &&
      !organization &&
      firstOrganization
    ) {
      router.replace(
        `/${encodeURIComponent(firstOrganization.slug)}/dashboard`,
      );
    }
  }, [
    organizations.isError,
    organizations.isPending,
    organization,
    firstOrganization,
    router,
  ]);

  const logout = useSignOutMutation();

  if (
    user.isPending ||
    (user.isError &&
      user.error instanceof ApiError &&
      user.error.status === 401)
  ) {
    return <LoaderDisplay message="Loading your workspace" fullScreen />;
  }

  if (user.isError) {
    return (
      <ErrorDisplay
        title="Unable to load your account"
        message={user.error.message}
        onRetry={() => void user.refetch()}
        fullScreen
      />
    );
  }

  if (
    !organizations.isPending &&
    !organizations.isError &&
    !organization &&
    firstOrganization
  ) {
    return <LoaderDisplay message="Loading your organization" fullScreen />;
  }
  if (organizations.isError) {
    return (
      <ErrorDisplay
        title="Unable to load organizations"
        message={organizations.error.message}
        onRetry={() => void organizations.refetch()}
        fullScreen
      />
    );
  }
  const organizationName =
    organization?.name ??
    (organizations.isLoading ? "Loading organization" : "Organization");
  const currentPage = allLinks
    .filter(({ path }) =>
      path === ""
        ? pathname === `/${encodeURIComponent(orgSlug)}/dashboard`
        : pathname.startsWith(
            `/${encodeURIComponent(orgSlug)}/dashboard${path}`,
          ),
    )
    .sort((a, b) => b.path.length - a.path.length)[0];

  return (
    <SidebarProvider>
      <AppSidebar
        pathname={pathname}
        orgSlug={orgSlug}
        organizations={organizations.data ?? []}
        organizationName={organizationName}
        user={user.data}
        isLoggingOut={logout.isPending}
        onLogout={() =>
          logout.mutate(undefined, {
            onSuccess: () => router.replace("/sign-in"),
            onError: (error) => toast.error(error.message),
          })
        }
      />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1" />
          <h1 className="truncate text-sm font-medium">
            {currentPage?.label ?? "Dashboard"}
          </h1>
          {/* <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Help">
              <CircleHelp className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Notifications">
              <Bell className="size-4" />
            </Button>
          </div> */}
        </header>
        <main className="w-full flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
