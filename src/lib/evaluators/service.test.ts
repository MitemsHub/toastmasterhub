import { describe, expect, it, vi } from "vitest";
import {
  createEvaluatorProfile,
  DuplicateEvaluatorError,
  listEvaluatorDirectoryItems,
} from "./service";

describe("listEvaluatorDirectoryItems", () => {
  it("maps shared evaluator records into directory items", async () => {
    const getFullList = vi.fn().mockResolvedValue([
      {
        id: "eva_1",
        collectionId: "collection",
        collectionName: "evaluators",
        created: "2026-07-06T00:00:00.000Z",
        updated: "2026-07-06T00:00:00.000Z",
        vpe: "vpe_1",
        full_name: "Amina Bello",
        email: "amina@example.com",
        phone: "+2348012345678",
        profile: "Warm evaluator who gives direct and practical feedback.",
        photo: "amina.jpg",
      },
    ]);

    const result = await listEvaluatorDirectoryItems({
      collection: () => ({
        getFullList,
      }),
      files: {
        getURL: () => "https://example.com/amina.jpg",
        getInfo: vi.fn().mockResolvedValue({
          $id: "file_1",
          name: "amina.jpg",
        }),
      },
    } as never);

    expect(getFullList).toHaveBeenCalledWith({
      sort: "-created",
    });
    expect(result).toEqual([
      {
        id: "eva_1",
        name: "Amina Bello",
        email: "amina@example.com",
        phone: "+2348012345678",
        profile: "Warm evaluator who gives direct and practical feedback.",
        photoUrl: "https://example.com/amina.jpg",
        createdAt: "2026-07-06T00:00:00.000Z",
        createdByVpeId: "vpe_1",
      },
    ]);
  });

  it("retries without created sorting when the backend rejects that field", async () => {
    const getFullList = vi
      .fn()
      .mockRejectedValueOnce({ status: 400 })
      .mockResolvedValueOnce([
        {
          id: "eva_1",
          collectionId: "collection",
          collectionName: "evaluators",
          vpe: "vpe_1",
          full_name: "Amina Bello",
          email: "amina@example.com",
          phone: "+2348012345678",
          profile: "Warm evaluator who gives direct and practical feedback.",
          photo: "amina.jpg",
        },
      ]);

    const result = await listEvaluatorDirectoryItems({
      collection: () => ({
        getFullList,
      }),
      files: {
        getURL: () => "https://example.com/amina.jpg",
        getInfo: vi.fn().mockResolvedValue({
          $id: "file_1",
          name: "amina.jpg",
        }),
      },
    } as never);

    expect(getFullList).toHaveBeenNthCalledWith(1, {
      sort: "-created",
    });
    expect(getFullList).toHaveBeenNthCalledWith(2, {});
    expect(result).toEqual([
      {
        id: "eva_1",
        name: "Amina Bello",
        email: "amina@example.com",
        phone: "+2348012345678",
        profile: "Warm evaluator who gives direct and practical feedback.",
        photoUrl: "https://example.com/amina.jpg",
        createdAt: "",
        createdByVpeId: "vpe_1",
      },
    ]);
  });

  it("treats generated import avatars as missing portraits", async () => {
    const getFullList = vi.fn().mockResolvedValue([
      {
        id: "eva_2",
        collectionId: "collection",
        collectionName: "evaluators",
        created: "2026-07-06T00:00:00.000Z",
        updated: "2026-07-06T00:00:00.000Z",
        vpe: "vpe_1",
        full_name: "Kunle Adeyemi",
        email: "kunle@example.com",
        phone: "+2348098765432",
        profile: "Experienced evaluator for prepared speeches and table topics.",
        photo: "file_2",
      },
    ]);

    const result = await listEvaluatorDirectoryItems({
      collection: () => ({
        getFullList,
      }),
      files: {
        getURL: vi.fn().mockReturnValue("https://example.com/generated.png"),
        getInfo: vi.fn().mockResolvedValue({
          $id: "file_2",
          name: "generated-evaluator-avatar-2.png",
        }),
      },
    } as never);

    expect(result).toEqual([
      {
        id: "eva_2",
        name: "Kunle Adeyemi",
        email: "kunle@example.com",
        phone: "+2348098765432",
        profile: "Experienced evaluator for prepared speeches and table topics.",
        photoUrl: "",
        createdAt: "2026-07-06T00:00:00.000Z",
        createdByVpeId: "vpe_1",
      },
    ]);
  });
});

describe("createEvaluatorProfile", () => {
  it("validates the submitted form data and creates a shared evaluator record", async () => {
    const create = vi.fn().mockResolvedValue({ id: "eva_1" });
    const getFirstListItem = vi.fn().mockRejectedValue({ status: 404 });
    const photo = new File(["photo"], "amina.jpg", { type: "image/jpeg" });
    const formData = new FormData();

    formData.set("fullName", "Amina Bello");
    formData.set("email", "amina@example.com");
    formData.set("phone", "+2348012345678");
    formData.set("profile", "Warm evaluator who gives direct and practical feedback.");
    formData.set("photo", photo);

    await createEvaluatorProfile(
      {
        collection: () => ({
          create,
          getFirstListItem,
        }),
        filter: vi.fn().mockReturnValue("email-filter"),
      },
      formData,
      "vpe_1",
    );

    expect(create).toHaveBeenCalledWith({
      vpe: "vpe_1",
      full_name: "Amina Bello",
      email: "amina@example.com",
      phone: "+2348012345678",
      profile: "Warm evaluator who gives direct and practical feedback.",
      photo,
    });
  });

  it("rejects a submission when the evaluator email already exists", async () => {
    const photo = new File(["photo"], "amina.jpg", { type: "image/jpeg" });
    const formData = new FormData();

    formData.set("fullName", "Amina Bello");
    formData.set("email", "amina@example.com");
    formData.set("phone", "+2348012345678");
    formData.set("profile", "Warm evaluator who gives direct and practical feedback.");
    formData.set("photo", photo);

    await expect(
      createEvaluatorProfile(
        {
          collection: () => ({
            create: vi.fn(),
            getFirstListItem: vi.fn().mockResolvedValue({
              id: "eva_existing",
            }),
          }),
          filter: vi.fn().mockReturnValue("email-filter"),
        } as never,
        formData,
        "vpe_1",
      ),
    ).rejects.toBeInstanceOf(DuplicateEvaluatorError);
  });
});
