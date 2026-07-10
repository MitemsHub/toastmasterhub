import { describe, expect, it, vi } from "vitest";
import { importEvaluatorsFromCsv } from "./import";

describe("importEvaluatorsFromCsv", () => {
  it("imports CSV rows and skips duplicate evaluators", async () => {
    const csvFile = new File(
      [
        [
          "fullName,email,phone,profile",
          "\"Amina Bello\",amina@example.com,\"+2348012345678\",\"Warm evaluator who gives direct and practical feedback.\"",
          "\"Amina Bello\",amina@example.com,\"+2348012345678\",\"Warm evaluator who gives direct and practical feedback.\"",
        ].join("\n"),
      ],
      "evaluators.csv",
      { type: "text/csv" },
    );

    const create = vi
      .fn()
      .mockResolvedValueOnce({ id: "eva_1" })
      .mockRejectedValueOnce(new Error("duplicate"));
    const getFirstListItem = vi
      .fn()
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce({ id: "eva_existing" });

    const result = await importEvaluatorsFromCsv(
      {
        collection: () => ({
          create,
          getFirstListItem,
        }),
        filter: vi.fn().mockReturnValue("email-filter"),
      } as never,
      csvFile,
      "vpe_1",
    );

    expect(result).toEqual({
      createdCount: 1,
      skippedDuplicateCount: 1,
    });
  });

  it("rejects malformed CSV uploads", async () => {
    const csvFile = new File(
      ["fullName,email,phone\nAmina Bello,amina@example.com,+2348012345678"],
      "evaluators.csv",
      { type: "text/csv" },
    );

    await expect(
      importEvaluatorsFromCsv(
        {
          collection: () => ({
            create: vi.fn(),
            getFirstListItem: vi.fn(),
          }),
          filter: vi.fn(),
        } as never,
        csvFile,
        "vpe_1",
      ),
    ).rejects.toThrow(/csv template/i);
  });
});
