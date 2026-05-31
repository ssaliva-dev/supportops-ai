import { describe, expect, it } from "vitest";

import { getStoreBackend, getStoreWarnings, isEphemeralBackend } from "@/lib/store";

describe("store backend wiring", () => {
  it("uses json backend in test mode", () => {
    expect(getStoreBackend()).toBe("json");
    expect(isEphemeralBackend()).toBe(true);
  });

  it("emits a production warning for json backend", () => {
    const warnings = getStoreWarnings({ nodeEnv: "production", vercelEnv: "production" });
    expect(warnings.some((warning) => warning.includes("JSON store is active in production"))).toBe(true);
  });

  it("does not emit production warning for local development", () => {
    const warnings = getStoreWarnings({ nodeEnv: "development", vercelEnv: "development" });
    expect(warnings.some((warning) => warning.includes("JSON store is active in production"))).toBe(false);
  });
});
