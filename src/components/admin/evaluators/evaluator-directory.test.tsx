import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvaluatorDirectory } from "./evaluator-directory";

describe("EvaluatorDirectory", () => {
  it("shows an empty state when there are no evaluator records", () => {
    render(<EvaluatorDirectory evaluators={[]} />);

    expect(screen.getByRole("heading", { name: /no shared evaluators yet/i })).toBeInTheDocument();
  });

  it("renders evaluator entries with photo and profile details", () => {
    render(
      <EvaluatorDirectory
        evaluators={[
          {
            id: "eva_1",
            name: "Jane Doe",
            email: "jane@example.com",
            phone: "+2348012345678",
            profile: "Experienced evaluator and speaker.",
            photoUrl: "https://example.com/jane.jpg",
            createdAt: "2026-08-01T10:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: /shared evaluator directory/i })).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("+2348012345678")).toBeInTheDocument();
    expect(screen.getByText("Experienced evaluator and speaker.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Jane Doe" }).getAttribute("src")).toContain(
      encodeURIComponent("https://example.com/jane.jpg"),
    );
    expect(screen.getByText(/added 2026-08-01/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("shows an inline confirmation state before deleting", () => {
    render(
      <EvaluatorDirectory
        evaluators={[
          {
            id: "eva_1",
            name: "Jane Doe",
            email: "jane@example.com",
            phone: "+2348012345678",
            profile: "Experienced evaluator and speaker.",
            photoUrl: "https://example.com/jane.jpg",
            createdAt: "2026-08-01T10:00:00.000Z",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(
      screen.getByText(/delete jane doe from the shared evaluator directory\?/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete evaluator/i })).toBeInTheDocument();
  });
});
