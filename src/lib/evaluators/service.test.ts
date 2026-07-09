import { describe, expect, it, vi } from "vitest";
import { createEvaluatorProfile, listEvaluatorDirectoryItems } from "./service";

describe("listEvaluatorDirectoryItems", () => {
  it("maps PocketBase evaluator records into photo-first directory items", async () => {
    const getFullList = vi.fn().mockResolvedValue([
      {
        id: "eva_1",
        collectionId: "collection",
        collectionName: "evaluators",
        created: "2026-07-06T00:00:00.000Z",
        updated: "2026-07-06T00:00:00.000Z",
        full_name: "Amina Bello",
        email: "amina@example.com",
        profile: "Warm evaluator who gives direct and practical feedback.",
        photo: "amina.jpg",
      },
    ]);

    const result = await listEvaluatorDirectoryItems({
      collection: () => ({
        getFullList,
      }),
      filter: vi.fn().mockReturnValue("vpe = 'vpe_1'"),
      files: {
        getURL: () => "https://example.com/amina.jpg",
      },
    } as never, "vpe_1");

    expect(getFullList).toHaveBeenCalledWith({
      filter: "vpe = 'vpe_1'",
      sort: "-created",
    });
    expect(result).toEqual([
      {
        id: "eva_1",
        name: "Amina Bello",
        email: "amina@example.com",
        profile: "Warm evaluator who gives direct and practical feedback.",
        photoUrl: "https://example.com/amina.jpg",
        createdAt: "2026-07-06T00:00:00.000Z",
      },
    ]);
  });

  it("retries without created sorting when PocketBase rejects that field", async () => {
    const getFullList = vi
      .fn()
      .mockRejectedValueOnce({ status: 400 })
      .mockResolvedValueOnce([
        {
          id: "eva_1",
          collectionId: "collection",
          collectionName: "evaluators",
          full_name: "Amina Bello",
          email: "amina@example.com",
          profile: "Warm evaluator who gives direct and practical feedback.",
          photo: "amina.jpg",
        },
      ]);

    const result = await listEvaluatorDirectoryItems({
      collection: () => ({
        getFullList,
      }),
      filter: vi.fn().mockReturnValue("vpe = 'vpe_1'"),
      files: {
        getURL: () => "https://example.com/amina.jpg",
      },
    } as never, "vpe_1");

    expect(getFullList).toHaveBeenNthCalledWith(1, {
      filter: "vpe = 'vpe_1'",
      sort: "-created",
    });
    expect(getFullList).toHaveBeenNthCalledWith(2, {
      filter: "vpe = 'vpe_1'",
    });
    expect(result).toEqual([
      {
        id: "eva_1",
        name: "Amina Bello",
        email: "amina@example.com",
        profile: "Warm evaluator who gives direct and practical feedback.",
        photoUrl: "https://example.com/amina.jpg",
        createdAt: "",
      },
    ]);
  });

  it("returns an empty list when PocketBase responds with a recoverable list error", async () => {
    const getFullList = vi.fn().mockRejectedValue({ status: 400 });

    const result = await listEvaluatorDirectoryItems({
      collection: () => ({
        getFullList,
      }),
      filter: vi.fn().mockReturnValue("vpe = 'vpe_1'"),
      files: {
        getURL: () => "https://example.com/amina.jpg",
      },
    } as never, "vpe_1");

    expect(result).toEqual([]);
  });
});

describe("createEvaluatorProfile", () => {
  it("validates the submitted form data and creates a PocketBase evaluator record", async () => {
    const create = vi.fn().mockResolvedValue({ id: "eva_1" });
    const photo = new File(["photo"], "amina.jpg", { type: "image/jpeg" });
    const formData = new FormData();

    formData.set("fullName", "Amina Bello");
    formData.set("email", "amina@example.com");
    formData.set("profile", "Warm evaluator who gives direct and practical feedback.");
    formData.set("photo", photo);

    await createEvaluatorProfile(
      {
        collection: () => ({
          create,
        }),
      },
      formData,
      "vpe_1",
    );

    expect(create).toHaveBeenCalledWith({
      vpe: "vpe_1",
      full_name: "Amina Bello",
      email: "amina@example.com",
      profile: "Warm evaluator who gives direct and practical feedback.",
      photo,
    });
  });

  it("rejects a submission without a photo file", async () => {
    const formData = new FormData();

    formData.set("fullName", "Amina Bello");
    formData.set("email", "amina@example.com");
    formData.set("profile", "Warm evaluator who gives direct and practical feedback.");

    await expect(
      createEvaluatorProfile(
        {
          collection: () => ({
            create: vi.fn(),
          }),
        },
        formData,
        "vpe_1",
      ),
    ).rejects.toThrow();
  });
});
