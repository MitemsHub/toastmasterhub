import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvaluatorDirectory } from "./evaluator-directory";

describe("EvaluatorDirectory", () => {
  it("shows an empty state when there are no evaluator records", () => {
    render(<EvaluatorDirectory evaluators={[]} />);

    expect(screen.getByRole("heading", { name: /no evaluator requests yet/i })).toBeInTheDocument();
  });

  it("renders evaluator entries with photo and profile details", () => {
    render(
      <EvaluatorDirectory
        evaluators={[
          {
            id: "eva_1",
            name: "Jane Doe",
            email: "jane@example.com",
            profile: "Experienced evaluator and speaker.",
            photoUrl: "https://example.com/jane.jpg",
            createdAt: "2026-08-01T10:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: /recently created evaluators/i })).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Experienced evaluator and speaker.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Jane Doe" }).getAttribute("src")).toContain(
      encodeURIComponent("https://example.com/jane.jpg"),
    );
    expect(screen.getByText(/added 2026-08-01/i)).toBeInTheDocument();
  });
});
