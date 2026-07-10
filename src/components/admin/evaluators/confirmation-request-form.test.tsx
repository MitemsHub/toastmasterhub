import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

  it("shows the newly selected portrait immediately in the evaluator summary", () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;

    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn().mockReturnValue("blob:preview"),
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: vi.fn(),
      configurable: true,
    });

    const createObjectUrlSpy = vi.mocked(URL.createObjectURL);
    const revokeObjectUrlSpy = vi.mocked(URL.revokeObjectURL);

    render(
      <ConfirmationRequestForm
        evaluators={[
          {
            id: "eva_1",
            name: "Amina Bello",
            email: "amina@example.com",
            phone: "+2348012345678",
            profile: "Warm evaluator who gives direct and practical feedback.",
            photoUrl: "",
          },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/^evaluator$/i), {
      target: { value: "eva_1" },
    });

    expect(screen.getByText(/no image/i)).toBeInTheDocument();

    const photoInput = screen.getByLabelText(/evaluator portrait|replace portrait/i);
    const selectedPhoto = new File(["photo"], "amina.jpg", { type: "image/jpeg" });

    fireEvent.change(photoInput, {
      target: {
        files: [selectedPhoto],
      },
    });

    expect(createObjectUrlSpy).toHaveBeenCalledWith(selectedPhoto);
    expect(screen.getByText(/selected portrait will be saved for this evaluator/i)).toBeInTheDocument();

    cleanup();

    Object.defineProperty(URL, "createObjectURL", {
      value: originalCreateObjectUrl,
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: originalRevokeObjectUrl,
      configurable: true,
    });
  });
});
