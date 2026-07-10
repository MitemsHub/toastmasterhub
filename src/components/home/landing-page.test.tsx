import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "./landing-page";

afterEach(() => {
  vi.useRealTimers();
});

describe("LandingPage", () => {
  it("renders the unified landing auth experience", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: /welcome vpe!/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^login$/i })[0]).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText(/access code/i)).toBeInTheDocument();
    expect(screen.getByText(/kindly login to manage evaluators confirmations/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /speaker presenting to an audience at a live event/i })).toBeInTheDocument();
  });

  it("switches to the request code form without leaving the page", () => {
    render(<LandingPage initialMode="login" />);

    fireEvent.click(screen.getByRole("button", { name: /request code/i }));

    expect(screen.getByRole("button", { name: /request code/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText(/vpe name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^otc$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your otc/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send access code/i })).toBeInTheDocument();
  });

  it("returns to the login form after showing the signup success message", () => {
    vi.useFakeTimers();
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    render(
      <LandingPage
        initialMode="signup"
        signupSuccessMessage="Your access code has been sent. Check your email, then switch back to login."
      />,
    );

    expect(screen.getByText(/your access code has been sent/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /request code/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(screen.queryByText(/your access code has been sent/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^login$/i })[0]).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText(/access code/i)).toBeInTheDocument();
    expect(replaceStateSpy).toHaveBeenCalled();
  });

  it("clears the signup error banner after a short delay", () => {
    vi.useFakeTimers();
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    render(
      <LandingPage
        initialMode="signup"
        signupErrorMessage="We could not send the access code. Please confirm your details and try again."
      />,
    );

    expect(screen.getByText(/we could not send the access code/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(screen.queryByText(/we could not send the access code/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send access code/i })).toBeInTheDocument();
    expect(replaceStateSpy).toHaveBeenCalled();
  });
});
