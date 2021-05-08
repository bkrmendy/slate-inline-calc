/* eslint-disable jest/no-conditional-expect */
import { Interpreter } from "./Interpreter/Interpreter";
import { ResultType } from "./Utils";


it("cannot parse incomplete expression", () => {
    const terp = Interpreter.withBuiltins(bs => bs.infix("+", 3, (left, right) => left + right));
    const result = terp.interpret("10 + ");
    expect(result.type).toEqual(ResultType.Error);
});

it ("cannot evaluate syntactically correct expression that has an undefined operator", () => {
    const terp = Interpreter.withBuiltins(bs => bs.infix("+", 3, (left, right) => left + right));
    const result = terp.interpret("10 - 10");
    expect(result.type).toEqual(ResultType.Error);
});

it ("cannot evaluate syntactically correct expression that has an undefined function", () => {
    const terp = Interpreter.withBuiltins(bs => bs.infix("+", 3, (left, right) => left + right));
    const result = terp.interpret("sin(3.14)");
    expect(result.type).toEqual(ResultType.Error);
});
