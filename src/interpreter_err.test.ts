/* eslint-disable jest/no-conditional-expect */
import { Interpreter } from "./Interpreter/Interpreter";
import { ResultType } from "./Utils";


it("cannot parse incomplete ipnut", () => {
    const terp = Interpreter.withBuiltins(bs => bs.infix("+", 3, (left, right) => left + right));
    const result = terp.interpret("10 + ");
    expect(result.type).toEqual(ResultType.Error);
});
