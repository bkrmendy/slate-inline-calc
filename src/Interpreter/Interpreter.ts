import { AST, ASTNodeType, Builtins, ASTFunctionDef, Token, Arity, Operator, TokenType, OperatorType, TokenOpenParen, TokenCloseParen, TokenOperator, ASTFunctionCall } from "./Types";
import { assertNever, err, ok, Result, ResultType } from "../Utils";

const isString = (a: string) => (b: string) => a === b;
const isOneOf = (elems: string[]) => (e: string) => elems.includes(e);
const isDigit = isOneOf(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]);
const isWhiteSpace = isOneOf([" ", "\t", "\n", ","]); // comma is whitespace for practical purposes

const isOpenParen = isString("(");
const isCloseParen = isString(")");

const toNumber = (literal: string) => parseInt(literal, 10);

const isOperatorChar = (c: string) => {
    const isLowerCaseLetter = "a".charCodeAt(0) <= c.charCodeAt(0) && c.charCodeAt(0) <= "z".charCodeAt(0);
    const isUpperCaseLetter = "A".charCodeAt(0) <= c.charCodeAt(0) && c.charCodeAt(0) <= "Z".charCodeAt(0);
    const isMathSymbol = isOneOf(["%", "*", "+", "-", "^"])(c);
    return (isLowerCaseLetter || isUpperCaseLetter || isMathSymbol);
}

// parse number from indexes [from, to)
const parseNumber = (from: number, source: string): { to: number, value: number } => {
    let literal = source[from];
    let to = from + 1;
    if (to < source.length && isDigit(source[to])) {
        to += 1;
    }
    return { to, value: toNumber(literal) };
}

const parseOperator = (from: number, source: string): { to: number, value: string } => {
    let to = from + 1;
    while (to < source.length && isOperatorChar(source[to])) {
        to += 1;
    }
    return { to, value: source.slice(from, to) };
}

const tokenize = (source: string): Result<string, Token[]> => {
    let tokens: Token[] = []
    let currentIndex = 0;
    while (currentIndex < source.length) {
        const lookAhead = source[currentIndex];
        if (isDigit(lookAhead)) {
            const { to, value } = parseNumber(currentIndex, source);
            tokens.push({ type: TokenType.Number, value });
            currentIndex = to;
        } else if (isOperatorChar(lookAhead)) {
            const { to, value } = parseOperator(currentIndex, source);
            tokens.push({ type: TokenType.Operator, operator: value });
            currentIndex = to;
        } else if (isOpenParen(lookAhead)) {
            tokens.push({ type: TokenType.OpenParen });
            currentIndex += 1;
        } else if (isCloseParen(lookAhead)) {
            tokens.push({ type: TokenType.CloseParen });
            currentIndex += 1;
        } else if (isWhiteSpace(lookAhead)) {
            currentIndex += 1;
        } else {
            return err(`Unexpected character: ${lookAhead}`);
        }
    }
    return ok(tokens);
}

const operator_to_ast = (op: Operator): ASTFunctionCall => {
    switch (op.type) {
        case OperatorType.Unary:
            return { type: ASTNodeType.Function, def: { arity: Arity.Unary, interpret: op.interpret } };
        case OperatorType.Binary:
            return { type: ASTNodeType.Function, def: { arity: Arity.Binary, interpret: op.interpret } };
        default:
            assertNever(op);
    }
    throw new Error("Should not get here because of exhaustiveness check");
}

const parse = (builtins: Builtins, tokens: Token[]): Result<string, AST[]> => {
    let output = new Array<AST>();
    let operator_q = new Array<TokenOpenParen | TokenOperator>();

    // https://en.wikipedia.org/wiki/Shunting-yard_algorithm
    while (tokens.length > 0) {
        const token = tokens.pop();
        if (token === undefined) { throw new Error("Should not get here beacuse of loop condition") }
        if (token.type === TokenType.Number) {
            output.push({ type: ASTNodeType.Number, value: token.value });
        } else if (token.type === TokenType.Operator) {
            const tokenOp = builtins.find(token.operator);
            if (tokenOp === undefined) { return err(`Operator not defined: "${token.operator}"`); }
            while (operator_q.length > 0) {
                const top = operator_q[operator_q.length - 1];
                if (top.type === TokenType.OpenParen) {
                    break;
                }
                const op = builtins.find(top.operator);
                if (op === undefined) { return err(`Operator not defined: "${top.operator}"`); }
                if (op.precedence >= tokenOp.precedence) {
                    output.push(operator_to_ast(op));
                } else {
                    break;
                }
            }
            operator_q.push(token);
        } else if (token.type === TokenType.OpenParen) {
            operator_q.push(token);
        } else if (token.type === TokenType.CloseParen) {
            if (operator_q.length < 1) {
                continue;
            }
            let top = operator_q[operator_q.length - 1];
            while (top.type !== TokenType.OpenParen) {
                const t = operator_q.pop();
                if (t === undefined) { return err("Mismatched parens!") };
                if (t.type === TokenType.Operator) {
                    const op = builtins.find(t.operator);
                    if (op === undefined) { return err("Operator not defined!") }
                    output.push(operator_to_ast(op));
                }
                top = operator_q[operator_q.length - 1];
            }
            if (operator_q.length > 0 && top.type === TokenType.OpenParen) {
                operator_q.pop();
            }
        } else {
            assertNever(token);
        }
    }

    while (operator_q.length > 0) {
        const o = operator_q.pop();
        if (o === undefined) { throw new Error("Should not get here beacuse of loop condition") }
        if (o.type === TokenType.OpenParen) { return err("Mismatched parens!"); }
        else if (o.type === TokenType.Operator) {
            const op = builtins.find(o.operator);
            if (op === undefined) { return err("Operator not defined!") }
            output.push(operator_to_ast(op));
        } else {
            assertNever(o);
        }
    }

    return ok(output);
}

const evalFunction = (stack: Array<number>, operator: ASTFunctionDef): { nextStack: Array<number>, result: number } => {
    switch (operator.arity) {
        case Arity.Unary:
            const arg = stack.shift();
            if (arg === undefined) { throw new Error("Should return result") };
            return { nextStack: stack, result: operator.interpret(arg) };
        case Arity.Binary:
            const left = stack.shift();
            const right = stack.shift();
            if (left === undefined || right === undefined) { throw new Error("Should return result") };
            return { nextStack: stack, result: operator.interpret(left, right) };
        default:
            assertNever(operator);
    }
    throw new Error("fahk yu eslint");
}

// https://stackoverflow.com/a/40329913
const evaluate = (ast: AST[]): Result<string, number> => {
    let stack = new Array<number>();
    while (ast.length > 0) {
        const node = ast.shift();
        if (node === undefined) { throw new Error("Should not get here because of loop condition"); }
        switch (node.type) {
            case ASTNodeType.Number:
                stack.unshift(node.value);
                break;
            case ASTNodeType.Function:
                const { nextStack, result } = evalFunction(stack, node.def);
                stack = nextStack;
                stack.unshift(result);
                break
            default:
                assertNever(node);
        }
    }
    return ok(stack[0]);
};

const interpret = (builtins: Builtins, source: string): Result<string, number> => {
    const tokens = tokenize(source);
    if (tokens.type === ResultType.Error) {
        return err(tokens.error);
    }

    const ast = parse(builtins, tokens.value);
    if (ast.type === ResultType.Error) {
        return err(ast.error);
    }

    return evaluate(ast.value);
}

export class BuiltinsImpl implements Builtins {
    defines: Operator[] = []

    infix = (op: string, precedence: number, interpret: (left: number, right: number) => number): Builtins => {
        this.defines.push({
            type: OperatorType.Binary,
            precedence,
            op,
            interpret
        });
        return this;
    }

    prefix = (op: string, precedence: number, interpret: (arg: number) => number): Builtins => {
        this.defines.push({
            type: OperatorType.Unary,
            precedence,
            op,
            interpret
        });
        return this;
    }

    find = (op: string): Operator | undefined => this.defines.find(def => def.op === op);
}

export class Interpreter {

    static withBuiltins(cb: (bs: Builtins) => Builtins): Interpreter {
        const terp = new Interpreter();
        cb(terp.builtins);
        return terp;
    }

    builtins: Builtins = new BuiltinsImpl();
    interpret = (source: string) => interpret(this.builtins, source);
}