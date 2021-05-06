/* eslint-disable jest/no-conditional-expect */
import { Interpreter } from "./Interpreter/Interpreter";
import { ResultType } from "./Utils";

it("basic example with addition", () => {
    const terp = Interpreter.withBuiltins(bs => bs.infix("+", 3, (left, right) => left + right));
    const result = terp.interpret("3 + 4");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(7);
    } else {
        throw new Error("Should not fail");
    }
})