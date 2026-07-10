import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvaluatorForm } from "./evaluator-form";

describe("EvaluatorForm", () => {
  it("renders the shared evaluator fields", () => {
    render(<EvaluatorForm />);

    expect(
      screen.getByRole("heading", { name: /add evaluator details once/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/evaluator name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/evaluator email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/evaluator profile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/evaluator portrait/i)).toBeRequired();
    expect(screen.getByRole("button", { name: /add to shared directory/i })).toBeInTheDocument();
  });

  it("shows evaluator save feedback messages", () => {
    render(
      <EvaluatorForm
        errorMessage="Please complete the request."
        successMessage="Evaluator added."
      />,
    );

    expect(screen.getByText("Please complete the request.")).toBeInTheDocument();
    expect(screen.getByText("Evaluator added.")).toBeInTheDocument();
  });
});
