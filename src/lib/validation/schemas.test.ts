import { describe, expect, it } from "vitest";
import { evaluatorSchema } from "./evaluator";
import { invitationSchema } from "./invitation";
import { accessCodeSchema, vpeSignupSchema } from "./vpe";

describe("evaluatorSchema", () => {
  it("accepts a valid evaluator payload", () => {
    const result = evaluatorSchema.safeParse({
      fullName: "Jane Doe",
      email: "jane@example.com",
      profile: "Level 2 speaker and evaluator",
      photoPath: "jane-doe.jpg",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a payload without a photo reference", () => {
    const result = evaluatorSchema.safeParse({
      fullName: "Jane Doe",
      email: "jane@example.com",
      profile: "Level 2 speaker and evaluator",
      photoPath: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("invitationSchema", () => {
  it("accepts a valid invitation payload", () => {
    const result = invitationSchema.safeParse({
      meetingTitle: "Toastmasters Club Meeting",
      meetingDate: "2026-08-15",
      meetingNote: "Please arrive 15 minutes early.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid meeting date", () => {
    const result = invitationSchema.safeParse({
      meetingTitle: "Toastmasters Club Meeting",
      meetingDate: "15-08-2026",
      meetingNote: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("vpeSignupSchema", () => {
  it("accepts a valid VPE signup payload", () => {
    const result = vpeSignupSchema.safeParse({
      fullName: "Amina Bello",
      email: "amina@example.com",
      signupOtc: "TMH-ABUJA-2026",
    });

    expect(result.success).toBe(true);
  });
});

describe("accessCodeSchema", () => {
  it("accepts a non-empty access code", () => {
    const result = accessCodeSchema.safeParse({
      accessCode: "ABCD-9F4K",
    });

    expect(result.success).toBe(true);
  });
});
