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

  it("paginates the shared directory list", () => {
    render(
      <EvaluatorDirectory
        evaluators={Array.from({ length: 5 }, (_, index) => ({
          id: `eva_${index + 1}`,
          name: `Evaluator ${index + 1}`,
          email: `evaluator${index + 1}@example.com`,
          phone: `+23480123456${index + 1}`,
          profile: `Profile ${index + 1}`,
          photoUrl: `https://example.com/evaluator-${index + 1}.jpg`,
          createdAt: "2026-08-01T10:00:00.000Z",
        }))}
      />,
    );

    expect(screen.getByText("Evaluator 1")).toBeInTheDocument();
    expect(screen.getByText("Evaluator 4")).toBeInTheDocument();
    expect(screen.queryByText("Evaluator 5")).not.toBeInTheDocument();
    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByText("Evaluator 5")).toBeInTheDocument();
    expect(screen.queryByText("Evaluator 1")).not.toBeInTheDocument();
    expect(screen.getByText(/showing 5-5/i)).toBeInTheDocument();
  });
});
