import { describe, it, expect } from "vitest";
import { getAlignmentClass } from "../src/lib/grid-helper";

describe("getAlignmentClass", () => {
    it('returns ttly-align-left for "left"', () => {
        expect(getAlignmentClass("left")).toBe("ttly-align-left");
    });

    it('returns ttly-align-right for "right"', () => {
        expect(getAlignmentClass("right")).toBe("ttly-align-right");
    });

    it('returns ttly-align-center for "center"', () => {
        expect(getAlignmentClass("center")).toBe("ttly-align-center");
    });
});
