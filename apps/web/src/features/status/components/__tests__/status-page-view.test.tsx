import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusPageView } from "../status-page-view";
import { SystemStatusHero } from "../system-status-hero";
import { ServiceMonitorCard } from "../service-monitor-card";
import { ServiceDetailsDialog } from "../service-details-dialog";
import { ActiveIncidents, IncidentHistory } from "../incident-timeline";
import { PublicStatusFooter } from "../public-status-footer";
import {
  OverallStatus,
  MonitorPerformanceStatus,
  type PublicStatusResponse,
} from "../../types/public-status";

// Mock api client
vi.mock("@app/lib/api/client", () => ({
  apiFetch: vi.fn(),
}));
vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}));

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
        />,
      );

      expect(screen.getByText("All systems operational")).toBeInTheDocument();
      expect(
        screen.getByText("Everything is operating normally."),
      ).toBeInTheDocument();
      expect(screen.getByText("99.98%")).toBeInTheDocument();
      expect(screen.getByText("90-Day Uptime")).toBeInTheDocument();
    });

    it("renders Degraded semantics", () => {
      render(<SystemStatusHero status={OverallStatus.DEGRADED} />);

      expect(
        screen.getByText("Some systems are experiencing issues"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Some services are currently operating below normal performance.",
        ),
      ).toBeInTheDocument();
    });

    it("renders Major Outage semantics", () => {
      render(<SystemStatusHero status={OverallStatus.MAJOR_OUTAGE} />);

      expect(screen.getByText("Service disruption")).toBeInTheDocument();
      expect(
        screen.getByText("One or more services are currently unavailable."),
      ).toBeInTheDocument();
    });

    it("does not render fake aggregate uptime when null", () => {
      render(
        <SystemStatusHero
          status={OverallStatus.OPERATIONAL}
          overallUptime={null}
        />,
      );

      expect(screen.queryByText("90-Day Uptime")).not.toBeInTheDocument();
    });
  });

  describe("UptimeBars", () => {
    it("renders green operational bar only for 100% with no failures", () => {
      const { container } = render(
        <ServiceMonitorCard
          monitor={{
            name: "API Gateway",
            status: MonitorPerformanceStatus.UP,
            uptime: 100,
            dailyUptime: [
              {
                date: "2026-09-10",
                uptimePercentage: 100,
                failureCount: 0,
                downDurationMinutes: 0,
              },
            ],
          }}
        />,
      );

      const bar = container.querySelector('[aria-label*="100% uptime (Operational)"]');
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveClass("bg-status-operational");
    });

    it("does not render green bar if there was any failure, and shows down for x mins in tooltip", () => {
      const { container } = render(
        <ServiceMonitorCard
          monitor={{
            name: "API Gateway",
            status: MonitorPerformanceStatus.UP,
            uptime: 99.8,
            dailyUptime: [
              {
                date: "2026-09-10",
                uptimePercentage: 99.79,
                failureCount: 3,
                downDurationMinutes: 3,
              },
            ],
          }}
        />,
      );

      // Should NOT have green operational bar
      const greenBar = container.querySelector(".bg-status-operational");
      expect(greenBar).not.toBeInTheDocument();

      // Tooltip label should have 'down for 3 minutes' (from formatDistanceStrict)
      const bar = container.querySelector('[aria-label*="down for 3 minutes"]');
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveClass("bg-status-degraded");
    });
  });

  describe("ServiceMonitorCard", () => {
    it("renders service name, operational status, and real metrics without raw HTTP badge", () => {
      render(
        <ServiceMonitorCard
          monitor={{
            name: "API Gateway",
            status: MonitorPerformanceStatus.UP,
            uptime: 99.95,
            responseTime: 142,
            lastStatusCode: 200,
            dailyUptime: [],
          }}
        />,
      );

      expect(screen.getByText("API Gateway")).toBeInTheDocument();
      expect(screen.getByText("Operational")).toBeInTheDocument();
      expect(screen.getByText("142ms")).toBeInTheDocument();
      expect(screen.getByText("99.95%")).toBeInTheDocument();

      // Ensure raw HTTP status is not displayed on the card surface
      expect(screen.queryByText("HTTP 200")).not.toBeInTheDocument();
    });

    it("renders DOWN as Outage with human-readable explanation overriding 99.99% historical uptime", () => {
      render(
        <ServiceMonitorCard
          monitor={{
            name: "Database Cluster",
            status: MonitorPerformanceStatus.DOWN,
            uptime: 99.99,
            responseTime: 231,
            lastStatusCode: 503,
          }}
        />,
      );

      expect(screen.getByText("Database Cluster")).toBeInTheDocument();
      expect(screen.getByText("Down")).toBeInTheDocument();
      expect(
        screen.getByText("Service currently unavailable"),
      ).toBeInTheDocument();
      // Historical uptime is still visible as secondary context
      expect(screen.getByText("99.99%")).toBeInTheDocument();
      // Raw HTTP status not on primary card
      expect(screen.queryByText("HTTP 503")).not.toBeInTheDocument();
    });

    it("maps SLOW status to Degraded with explanatory message", () => {
      render(
        <ServiceMonitorCard
          monitor={{
            name: "Checkout Service",
            status: MonitorPerformanceStatus.SLOW,
            uptime: 98.5,
            responseTime: 950,
          }}
        />,
      );

      expect(screen.getByText("Checkout Service")).toBeInTheDocument();
      expect(screen.getByText("Degraded")).toBeInTheDocument();
      expect(screen.getByText("950ms")).toBeInTheDocument();
      expect(screen.getByText("Response time above normal")).toBeInTheDocument();
    });

    it("hides missing response time and uptime without breaking", () => {
      render(
        <ServiceMonitorCard
          monitor={{
            name: "New Service",
            status: MonitorPerformanceStatus.PENDING,
          }}
        />,
      );

      expect(screen.getByText("New Service")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.queryByText(/ms$/)).not.toBeInTheDocument();
      expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
    });

    it("fires onViewDetails when Details button is clicked", () => {
      const onViewDetails = vi.fn();
      render(
        <ServiceMonitorCard
          monitor={{
            name: "Auth Service",
            status: MonitorPerformanceStatus.UP,
          }}
          onViewDetails={onViewDetails}
        />,
      );

      const detailsBtn = screen.getByRole("button", { name: /Details/i });
      expect(detailsBtn).toBeInTheDocument();
      fireEvent.click(detailsBtn);
      expect(onViewDetails).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Auth Service" }),
      );
    });
  });

  describe("ServiceDetailsDialog", () => {
    it("renders full public-safe telemetry when open", () => {
      render(
        <ServiceDetailsDialog
          isOpen={true}
          onClose={vi.fn()}
          monitor={{
            name: "Payments API",
            status: MonitorPerformanceStatus.DOWN,
            uptime: 99.85,
            responseTime: 540,
            lastStatusCode: 503,
            dailyUptime: [],
          }}
        />,
      );

      expect(screen.getByText("Payments API")).toBeInTheDocument();
      expect(
        screen.getByText("Service Telemetry & Performance"),
      ).toBeInTheDocument();
      expect(screen.getByText("HTTP 503")).toBeInTheDocument();
      expect(screen.getByText("540ms")).toBeInTheDocument();
      expect(screen.getByText("99.85%")).toBeInTheDocument();
      expect(
        screen.getByText(/Service is currently unavailable/),
      ).toBeInTheDocument();
    });

    it("does not render when monitor is null", () => {
      const { container } = render(
        <ServiceDetailsDialog
          isOpen={true}
          onClose={vi.fn()}
          monitor={null}
        />,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("ActiveIncidents & IncidentHistory", () => {
    it("renders active incidents with title, lifecycle, and started time", () => {
      render(
        <ActiveIncidents
          incidents={[
            {
              id: "6a9f1fbd901363444f13b8ae",
              publicId: "INC-88912",
              title: "Payment gateway timeout spike",
              status: "active",
              incidentStatus: "INVESTIGATING",
              severity: "MAJOR",
              publicMessage: "We are currently investigating elevated latency.",
              startedAt: "2026-09-08T18:51:42.028Z",
              events: [
                {
                  type: "STATUS_UPDATE",
                  status: "INVESTIGATING",
                  message: "Investigation started by automated monitor check.",
                  createdAt: "2026-09-08T18:51:42.028Z",
                },
              ],
            },
          ]}
        />,
      );

      expect(screen.getByText("Incident #INC-88912")).toBeInTheDocument();
      expect(
        screen.getByText("Payment gateway timeout spike"),
      ).toBeInTheDocument();
      expect(screen.getByText("Investigating")).toBeInTheDocument();
      expect(screen.getByText("Major")).toBeInTheDocument();
      expect(
        screen.getByText("We are currently investigating elevated latency."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Investigation started by automated monitor check."),
      ).toBeInTheDocument();
    });

    it("renders clean empty state when no active incidents", () => {
      render(<ActiveIncidents incidents={[]} />);

      expect(screen.getByText("No active incidents")).toBeInTheDocument();
    });

    it("groups resolved incidents by date with real duration and title", () => {
      render(
        <IncidentHistory
          incidents={[
            {
              id: "6a945c478eaa6d270eb25994",
              title: "Temporary DNS Resolution Slowdown",
              status: "resolved",
              incidentStatus: "RESOLVED",
              startedAt: "2026-09-08T15:00:00.000Z",
              resolvedAt: "2026-09-08T15:30:00.000Z",
              duration: 1800,
            },
          ]}
        />,
      );

      expect(screen.getByText("September 8, 2026")).toBeInTheDocument();
      expect(
        screen.getByText("Temporary DNS Resolution Slowdown"),
      ).toBeInTheDocument();
      expect(screen.getByText("Resolved")).toBeInTheDocument();
      expect(screen.getByText("30m")).toBeInTheDocument();

      // Ensure zero fake copy
      expect(
        screen.queryByText(/Root cause identified/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/nominal baselines/),
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
        screen.queryByText("Operational Telemetry & SLAs"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Check Response Time"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Global Cluster")).not.toBeInTheDocument();
      expect(screen.queryByText("Live Telemetry")).not.toBeInTheDocument();
      expect(screen.queryByText(/Upwatch/i)).not.toBeInTheDocument();
    });
  });
});
