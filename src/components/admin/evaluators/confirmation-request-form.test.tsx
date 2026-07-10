import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfirmationRequestForm } from "./confirmation-request-form";

describe("ConfirmationRequestForm", () => {
  it("renders the shared evaluator selector and meeting fields", () => {
    render(
      <ConfirmationRequestForm
        evaluators={[
          {
            id: "eva_1",
            name: "Amina Bello",
            email: "amina@example.com",
            phone: "+2348012345678",
            profile: "Warm evaluator who gives direct and practical feedback.",
            photoUrl: "https://example.com/amina.jpg",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /choose a shared evaluator and send the request/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^evaluator$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/evaluator portrait/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/meeting date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/meeting title/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send for confirmation/i })).toBeInTheDocument();
  });

  it("fills the evaluator summary after selection", () => {
    render(
      <ConfirmationRequestForm
        evaluators={[
          {
            id: "eva_1",
            name: "Amina Bello",
            email: "amina@example.com",
            phone: "+2348012345678",
            profile: "Warm evaluator who gives direct and practical feedback.",
            photoUrl: "https://example.com/amina.jpg",
          },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/^evaluator$/i), {
      target: { value: "eva_1" },
    });

    expect(screen.getByText("Amina Bello")).toBeInTheDocument();
    expect(screen.getByText("amina@example.com")).toBeInTheDocument();
    expect(screen.getByText("+2348012345678")).toBeInTheDocument();
    expect(
      screen.getByText("Warm evaluator who gives direct and practical feedback."),
    ).toBeInTheDocument();
    expect(screen.getByText(/replace portrait/i)).toBeInTheDocument();
    expect(screen.queryByText(/choose from the shared directory/i)).not.toBeInTheDocument();
  });
});
