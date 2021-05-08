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

it("Example from wikipedia", () => {
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