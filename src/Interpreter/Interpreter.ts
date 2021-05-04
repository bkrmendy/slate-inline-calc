import { AST, ASTNodeType, Builtins, ASTFunctionDef, Token, Arity, Operator, TokenType } from "./Types";
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
    const isMathSymbol = isOneOf(["%", "*", "+", "-", "^",]);
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


const parse = (tokens: Token[]): Result<string, AST[]> => {
    let output = new Array<AST>();
    let operator_q = new Array<Token>();

    // https://en.wikipedia.org/wiki/Shunting-yard_algorithm
    while (tokens.length > 0) {
        const token = tokens.pop();
        if (token === undefined) { throw new Error("Should not get here beacuse of loop condition") }
        if (token.type === TokenType.Number) {
            output.push({ type: ASTNodeType.Number, value: token.value });
        } if (token.type === TokenType.OpenParen) {
            operator_q.push(token);
        } else if (token.type === TokenType.CloseParen) {
            let top = operator_q[operator_q.length - 1];
            while (top.type !== TokenType.OpenParen) {
                const t = operator_q.pop();
                if (t === undefined) { return err("Mismatched parens!") };
                if (t.type === TokenType.Operator) {
                    output.push({ type: ASTNodeType.Function, })
                }
                top = operator_q[operator_q.length - 1];
            }

        }
        else {
            assertNever(token);
        }
    }

    return ok(output);
}

const evalFunction = (stack: Array<number>, operator: ASTFunctionDef): { nextStack: Array<number>, result: number } => {
    switch (operator.arity) {
        case Arity.Unary:
            const arg = stack.shift();
            if (arg === undefined) { throw new Error("Should return result") }
            return { nextStack: stack, result: operator.interpret(arg) };
        case Arity.Binary:
            const left = stack.shift();
            const right = stack.shift();
            if (left === undefined || right === undefined) { throw new Error("Should return result") }
            return { nextStack: stack, result: operator.interpret(left, right) }
        case Arity.NAry:
            throw new Error("Should return result")
        default:
            assertNever(operator);
    }
    throw new Error("fahk yu eslint");
}

// https://stackoverflow.com/a/40329913
const evaluate = (ast: AST[]): number => {
    let stack = new Array<number>();
    while (ast.length > 0) {
        const node = ast.shift();
        if (node === undefined) {
            throw new Error("Should not get here because of loop condition");
        }
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
    return stack[0];
};

const interpret = (builtins: Builtins, source: string): Result<string, number> => {
    const tokens = tokenize(source);
    if (tokens.type === ResultType.Error) {
        return err(tokens.error);
    }

    const ast = parse(tokens.value);
    if (ast.type === ResultType.Error) {
        return err("Cannot parse!");
    }

    const result = evaluate(ast.value);

    return ok(result);
}

export class BuiltinsImpl implements Builtins {
    defines: Operator[] = []

    private add = (op: Operator): Builtins => {
        this.defines.push(op);
        return this;
    }

    prefix = this.add;
    infix = this.add;
    define = this.add;
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