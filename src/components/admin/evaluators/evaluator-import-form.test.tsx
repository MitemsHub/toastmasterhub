import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvaluatorImportForm } from "./evaluator-import-form";

describe("EvaluatorImportForm", () => {
  it("renders the bulk upload controls and template link", () => {
    render(<EvaluatorImportForm />);

    expect(
      screen.getByRole("heading", { name: /import evaluators with the template/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download csv template/i })).toHaveAttribute(
      "href",
      "/templates/evaluators-import-template.csv",
    );
    expect(screen.getByLabelText(/csv upload/i)).toBeRequired();
    expect(screen.getByRole("button", { name: /upload evaluators/i })).toBeInTheDocument();
  });
});
