import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusPageView } from "../status-page-view";
import { SystemStatusHero } from "../system-status-hero";
import { ServiceMonitorCard } from "../service-monitor-card";
import { ActiveIncidents, IncidentHistory } from "../incident-timeline";
import { PublicStatusFooter } from "../public-status-footer";
import {
  OverallStatus,
  MonitorPerformanceStatus,
  type PublicStatusResponse,
} from "../../types/public-status";

// Mock api client
vi.mock("@app/lib/api/client");
vi.mock("@/lib/api/client");

describe("Public Status Components", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("SystemStatusHero", () => {
    it("renders Operational semantics", () => {
      render(
        <SystemStatusHero
          status={OverallStatus.OPERATIONAL}
          overallUptime={99.98}
        />
      );

      expect(screen.getByText("All systems operational")).toBeInTheDocument();
      expect(
        screen.getByText("Everything is operating normally.")
      ).toBeInTheDocument();
      expect(screen.getByText("99.98%")).toBeInTheDocument();
      expect(screen.getByText("90-Day Uptime")).toBeInTheDocument();
    });

    it("renders Degraded semantics", () => {
      render(<SystemStatusHero status={OverallStatus.DEGRADED} />);

      expect(
        screen.getByText("Some systems are experiencing issues")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Some services are currently operating below normal performance."
        )
      ).toBeInTheDocument();
    });

    it("renders Major Outage semantics", () => {
      render(<SystemStatusHero status={OverallStatus.MAJOR_OUTAGE} />);

      expect(screen.getByText("Service disruption")).toBeInTheDocument();
      expect(
        screen.getByText("One or more services are currently unavailable.")
      ).toBeInTheDocument();
    });

    it("does not render fake aggregate uptime when null", () => {
      render(
        <SystemStatusHero
          status={OverallStatus.OPERATIONAL}
          overallUptime={null}
        />
      );

      expect(screen.queryByText("90-Day Uptime")).not.toBeInTheDocument();
    });
  });

  describe("ServiceMonitorCard", () => {
    it("renders service name, operational status, and real metrics", () => {
      render(
        <ServiceMonitorCard
          monitor={{
            name: "API Gateway",
            status: MonitorPerformanceStatus.UP,
            uptime: 99.95,
            responseTime: 142,
            dailyUptime: [],
          }}
        />
      );

      expect(screen.getByText("API Gateway")).toBeInTheDocument();
      expect(screen.getByText("Operational")).toBeInTheDocument();
      expect(screen.getByText("142ms")).toBeInTheDocument();
      expect(screen.getByText("99.95%")).toBeInTheDocument();
    });

    it("maps SLOW status to Degraded", () => {
      render(
        <ServiceMonitorCard
          monitor={{
            name: "Checkout Service",
            status: MonitorPerformanceStatus.SLOW,
            uptime: 98.5,
            responseTime: 950,
          }}
        />
      );

      expect(screen.getByText("Checkout Service")).toBeInTheDocument();
      expect(screen.getByText("Degraded")).toBeInTheDocument();
      expect(screen.getByText("950ms")).toBeInTheDocument();
    });

    it("hides missing response time and uptime without breaking", () => {
      render(
        <ServiceMonitorCard
          monitor={{
            name: "New Service",
            status: MonitorPerformanceStatus.PENDING,
          }}
        />
      );

      expect(screen.getByText("New Service")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.queryByText(/ms$/)).not.toBeInTheDocument();
      expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
    });
  });

  describe("ActiveIncidents & IncidentHistory", () => {
    it("renders active incidents with started time and investigating badge", () => {
      render(
        <ActiveIncidents
          incidents={[
            {
              id: "6a9f1fbd901363444f13b8ae",
              status: "active",
              startedAt: "2026-09-08T18:51:42.028Z",
            },
          ]}
        />
      );

      expect(screen.getByText("Incident #13B8AE")).toBeInTheDocument();
      expect(screen.getByText("Investigating")).toBeInTheDocument();
      expect(screen.getByText(/Started/)).toBeInTheDocument();
    });

    it("renders clean empty state when no active incidents", () => {
      render(<ActiveIncidents incidents={[]} />);

      expect(screen.getByText("No active incidents")).toBeInTheDocument();
    });

    it("groups resolved incidents by date without fake root cause copy", () => {
      render(
        <IncidentHistory
          incidents={[
            {
              id: "6a945c478eaa6d270eb25994",
              status: "resolved",
              startedAt: "2026-09-08T15:00:00.000Z",
              resolvedAt: "2026-09-08T15:30:00.000Z",
              duration: 1800,
            },
          ]}
        />
      );

      expect(screen.getByText("September 8, 2026")).toBeInTheDocument();
      expect(screen.getByText("Incident #EB25994")).toBeInTheDocument();
      expect(screen.getByText("Resolved")).toBeInTheDocument();
      expect(screen.getByText("30m")).toBeInTheDocument();

      // Ensure zero fake copy
      expect(
        screen.queryByText(/Root cause identified/)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/nominal baselines/)
      ).not.toBeInTheDocument();
    });

    it("renders clean empty state when no incidents recorded", () => {
      render(<IncidentHistory incidents={[]} />);

      expect(screen.getByText("No incidents recorded.")).toBeInTheDocument();
    });
  });

  describe("PublicStatusFooter", () => {
    it("displays Powered by Operatio and status page name", () => {
      render(<PublicStatusFooter statusPageName="Acme Corp" />);

      expect(screen.getByText("Operatio")).toBeInTheDocument();
      expect(screen.getByText("Acme Corp Status")).toBeInTheDocument();
      expect(screen.queryByText(/Upwatch/i)).not.toBeInTheDocument();
    });
  });

  describe("StatusPageView Integrated View", () => {
    const mockData: PublicStatusResponse = {
      statusPage: {
        name: "Acme Corp",
        slug: "acme",
        description: "Official real-time status",
      },
      status: OverallStatus.OPERATIONAL,
      monitors: [
        {
          name: "Core API",
          status: MonitorPerformanceStatus.UP,
          uptime: 99.99,
          responseTime: 120,
          dailyUptime: [],
        },
      ],
      incidents: [],
      aggregateUptime: 99.99,
    };

    it("renders complete customer-facing status page without internal telemetry", () => {
      render(<StatusPageView slug="acme" initialData={mockData} />, {
        wrapper,
      });

      // Header & Branding
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      expect(screen.getByText("Official real-time status")).toBeInTheDocument();
      expect(screen.getByText("Operatio")).toBeInTheDocument();

      // Overall Status
      expect(screen.getByText("All systems operational")).toBeInTheDocument();

      // Services
      expect(screen.getByText("Services")).toBeInTheDocument();
      expect(screen.getByText("Core API")).toBeInTheDocument();

      // Incident History
      expect(screen.getByText("Incident History")).toBeInTheDocument();
      expect(screen.getByText("No incidents recorded.")).toBeInTheDocument();

      // Strictly verify no internal telemetry sections
      expect(
        screen.queryByText("Operational Telemetry & SLAs")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Check Response Time")
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Global Cluster")).not.toBeInTheDocument();
      expect(screen.queryByText("Live Telemetry")).not.toBeInTheDocument();
      expect(screen.queryByText(/Upwatch/i)).not.toBeInTheDocument();
    });
  });
});
