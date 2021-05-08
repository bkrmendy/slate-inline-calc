/* eslint-disable jest/no-conditional-expect */
import { parseNumber } from "./Interpreter/Tokenize";
import { ResultType } from "./Utils";

const testParseOK = (literal: string, expectedValue: number) => {
    const result = parseNumber(0, literal);
    if (result.type === ResultType.OK) {
        expect(result.value.value).toEqual(expectedValue);
    } else {
        throw new Error(`Cannot parse ${literal}, reason: ${result.error}`);
    }
}

const testParseErr = (literal: string) => {
    const result = parseNumber(0, literal);
    expect(result.type).toEqual(ResultType.Error);
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

// Tests that should return err
// (Because of the author's aesthetic convictions)

it("cannot parse number with leading decimal point", () => {
    testParseErr(".43");
});

it("cannot parse number with decimal point without fractional part", () => {
    testParseErr("12.");
});

it("cannot parse number with any sign and leading decimal point", () => {
    testParseErr("-.43");
});