import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvaluatorForm } from "./evaluator-form";

describe("EvaluatorForm", () => {
  it("renders the evaluator request fields", () => {
    render(<EvaluatorForm />);

    expect(
      screen.getByRole("heading", { name: /create the request and send it once/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/evaluator name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/evaluator email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/evaluator profile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/meeting date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/meeting title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/evaluator portrait/i)).toBeRequired();
    expect(screen.getByRole("button", { name: /send for confirmation/i })).toBeInTheDocument();
  });

  it("shows evaluator save feedback messages", () => {
    render(
      <EvaluatorForm
        errorMessage="Please complete the request."
        successMessage="Confirmation sent."
      />,
    );

    expect(screen.getByText("Please complete the request.")).toBeInTheDocument();
    expect(screen.getByText("Confirmation sent.")).toBeInTheDocument();
  });
});
