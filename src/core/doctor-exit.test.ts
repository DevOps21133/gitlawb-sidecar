import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DoctorCheck } from "./types.js";

function doctorCode(checks: DoctorCheck[]): number {
  return checks.every((c) => c.ok) ? 0 : 1;
}

describe("doctor exit code", () => {
  it("is 0 when every check passes", () => {
    assert.equal(
      doctorCode([
        { name: "a", ok: true, detail: "x" },
        { name: "b", ok: true, detail: "y" },
      ]),
      0,
    );
  });

  it("is 1 when any check fails", () => {
    assert.equal(
      doctorCode([
        { name: "a", ok: true, detail: "x" },
        { name: "b", ok: false, detail: "nope" },
      ]),
      1,
    );
  });
});
