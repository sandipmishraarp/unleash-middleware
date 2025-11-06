import { computeStatusFromProbes } from "@/lib/status";
import type { ProbeResult } from "@prisma/client";

describe("computeStatusFromProbes", () => {
  const now = Date.now();
  const baseDate = new Date(now);

  function makeProbe(overrides: Partial<ProbeResult>): ProbeResult {
    return {
      id: overrides.id ?? Math.floor(Math.random() * 1_000_000),
      resource: overrides.resource ?? "unleashed:Products",
      ok: overrides.ok ?? true,
      statusCode: overrides.statusCode ?? 200,
      errorText: overrides.errorText ?? null,
      createdAt: overrides.createdAt ?? baseDate,
    };
  }

  it("returns GREEN when last probe succeeded within 5 minutes", () => {
    const result = computeStatusFromProbes([
      makeProbe({ createdAt: new Date(now - 60_000), ok: true }),
      makeProbe({ createdAt: new Date(now - 10 * 60_000), ok: false }),
    ]);
    expect(result.status).toBe("GREEN");
  });

  it("returns ORANGE when there are mixed results within 60 minutes", () => {
    const result = computeStatusFromProbes([
      makeProbe({ createdAt: new Date(now - 10 * 60_000), ok: false }),
      makeProbe({ createdAt: new Date(now - 20 * 60_000), ok: true }),
    ]);
    expect(result.status).toBe("ORANGE");
    expect(result.failuresLastHour).toBe(1);
  });

  it("returns RED when no successes within 60 minutes", () => {
    const result = computeStatusFromProbes([
      makeProbe({ createdAt: new Date(now - 70 * 60_000), ok: true }),
      makeProbe({ createdAt: new Date(now - 5 * 60_000), ok: false }),
    ]);
    expect(result.status).toBe("RED");
  });

  it("returns RED when last status was unauthorized", () => {
    const result = computeStatusFromProbes([
      makeProbe({
        createdAt: new Date(now - 2 * 60_000),
        ok: false,
        statusCode: 401,
      }),
      makeProbe({ createdAt: new Date(now - 20 * 60_000), ok: true }),
    ]);
    expect(result.status).toBe("RED");
  });
});
