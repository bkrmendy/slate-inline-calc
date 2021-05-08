/* eslint-disable jest/no-conditional-expect */
import { Interpreter } from "./Interpreter/Interpreter";
import { ResultType } from "./Utils";

it("addition", () => {
    const terp = Interpreter.withBuiltins(bs => bs.infix("+", 3, (left, right) => left + right));
    const result = terp.interpret("10 + 4");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(14);
    } else {
        throw new Error(result.error);
    }
});

it("multiplication", () => {
    const terp = Interpreter.withBuiltins(bs => bs.infix("*", 3, (left, right) => left * right));
    const result = terp.interpret("3 * 4");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(12);
    } else {
        throw new Error(result.error);
    }
});

it("subtraction", () => {
    const terp = Interpreter.withBuiltins(bs => bs.infix("-", 3, (left, right) => left - right));
    const result = terp.interpret("4 - 3");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(1);
    } else {
        throw new Error(result.error);
    }
});

it("division", () => {
    const terp = Interpreter.withBuiltins(bs => bs.infix("/", 3, (left, right) => left / right));
    const result = terp.interpret("12 / 3");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(4);
    } else {
        throw new Error(result.error);
    }
});

it("power function", () => {
    const terp = Interpreter.withBuiltins(bs => bs.infix("^", 3, (left, right) => Math.pow(left, right)));
    const result = terp.interpret("2 ^ 3");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(8);
    } else {
        throw new Error(result.error);
    }
});

it("precedence", () => {
    const terp
        = Interpreter
            .withBuiltins(bs =>
                bs
                    .infix("*", 4, (left, right) => left * right)
                    .infix("+", 3, (left, right) => left + right)
            );
    const result = terp.interpret("2 + 2 * 3");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(8);
    } else {
        throw new Error(result.error);
    }
});

it("precedence, other way", () => {
    const terp
        = Interpreter
            .withBuiltins(bs =>
                bs
                    .infix("*", 4, (left, right) => left * right)
                    .infix("+", 3, (left, right) => left + right)
            );
    const result = terp.interpret("4 * 2 + 2");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(10);
    } else {
        throw new Error(result.error);
    }
});

it("parentheses", () => {
    const terp
        = Interpreter
            .withBuiltins(bs =>
                bs
                    .infix("*", 4, (left, right) => left * right)
                    .infix("+", 3, (left, right) => left + right)
            );
    const result = terp.interpret("(2 + 2) * 3");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(12);
    } else {
        throw new Error(result.error);
    }
});

it("Complex example", () => {
    const terp
        = Interpreter
            .withBuiltins(bs =>
                bs
                    .infix("*", 4, (left, right) => left * right)
                    .infix("/", 4, (left, right) => left / right)
                    .infix("+", 3, (left, right) => left + right)
                    .infix("-", 2, (left, right) => left - right)
            );
    const result = terp.interpret("3 + 4 * 2 / ( 1 - 5 ) + 6");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(7);
    } else {
        throw new Error(result.error);
    }
});

it("Can evaluate expression with builtin one-parameter function", () => {
    const terp = Interpreter.withBuiltins(bs => bs.define("abs", 1, ([arg]) => Math.abs(arg)));
    const result = terp.interpret("abs(-10)");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(10);
    } else {
        throw new Error(result.error);
    }
});

it("Can evaluate expression with builtin two-parameter function", () => {
    const terp = Interpreter.withBuiltins(bs => bs.define("max", 1, ([a, b]) => Math.max(a, b)));
    const result = terp.interpret("max(3, 2)");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(3);
    } else {
        throw new Error(result.error);
    }
});

it("Can evaluate expression with function called with expressions", () => {
    const terp
        = Interpreter
            .withBuiltins(bs =>
                bs
                    .define("max", 2, ([a, b]) => Math.max(a, b))
                    .infix("+", 3, (left, right) => left + right)
                    .infix("*", 4, (left, right) => left * right)
            );
    const result = terp.interpret("max(5, 3 * 3)");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(Math.max(3 + 3, 3 * 3));
    } else {
        throw new Error(result.error);
    }
});

it("Can evaluate expression with trinary function", () => {
    const terp
        = Interpreter
            .withBuiltins(bs =>
                bs
                    .define("max", 2, ([a, b]) => Math.max(a, b))
                    .define("clamp", 3, ([lo, hi, value]) => {
                        if (value < lo) { return lo; }
                        if (value > hi) { return hi; }
                        return value;
                    })
                    .define("abs", 1, ([n]) => Math.abs(n))
                    .infix("+", 3, (left, right) => left + right)
                    .infix("*", 4, (left, right) => left * right)
            );
    const result = terp.interpret("clamp(0, 4, -10)");
    if (result.type === ResultType.OK) {
        expect(result.value).toEqual(0);
    } else {
        throw new Error(result.error);
    }
});



