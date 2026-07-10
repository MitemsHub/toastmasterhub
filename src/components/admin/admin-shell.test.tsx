import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminShell } from "./admin-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/invitations",
}));

describe("AdminShell", () => {
  it("renders the VPE workspace navigation and child content", () => {
    render(
      <AdminShell
        signOutAction={async () => {}}
        vpeEmail="amina@example.com"
        vpeName="Amina Bello"
      >
        <div>Dashboard content</div>
      </AdminShell>,
    );

    expect(screen.getByText(/toast masters hub/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /manage evaluators/i })).toHaveAttribute(
      "href",
      "/admin/evaluators",
    );
    expect(screen.getByRole("link", { name: /view confirmations/i })).toHaveAttribute(
      "href",
      "/admin/invitations",
    );
    expect(screen.getByText("Amina Bello")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });
});
