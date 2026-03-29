import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "@/App";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

describe("App render", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/activity/catalog")) {
        return new Response(JSON.stringify({ activities: [] }), { status: 200 });
      }

      if (url.includes("/api/user/profile")) {
        return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
      }

      return new Response(JSON.stringify({}), { status: 200 });
    });

    window.history.pushState({}, "", "/login");
  });

  it("renders the sign in page when unauthenticated", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
      expect(screen.getByText("Ecobot")).toBeInTheDocument();
    });
  });
});
