import { parseNumber } from "./Interpreter/Tokenize";
import { ResultType } from "./Utils";


const testParseErr = (literal: string) => {
    const result = parseNumber(0, literal);
    expect(result.type).toEqual(ResultType.Error);
}

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