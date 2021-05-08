/* eslint-disable jest/no-conditional-expect */
import { parseNumber } from "./Interpreter/Tokenize";
import { ResultType } from "./Utils";

const testParseOK = (literal: string, expectedValue: number) => {
    const result = parseNumber(0, literal);
    if (result.type === ResultType.OK) {
        expect(result.value.token.value).toEqual(expectedValue);
    } else {
        throw new Error(`Cannot parse ${literal}, reason: ${result.error}`);
    }
}

// Tests that should return ok

it("can parse integer number without sign", () => {
    testParseOK("1337", 1337);
});

it("can parse interger with positive", () => {
    testParseOK("+1337", 1337);
});

it("can parse number with negative sign", () => {
    testParseOK("-1337", -1337);
});

it("can parse number with fractional part", () => {
    testParseOK("1337.42", 1337.42);
});

it("can parse number with sign and fractional part", () => {
    testParseOK("-1337.42", -1337.42);
});

