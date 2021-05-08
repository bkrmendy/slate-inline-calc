import { tokenize } from "./Tokenize"
import {
    Arity,
    AST,
    ASTNodeType,
    ASTFunctionCall,
    ASTFunctionDef,
    Builtins,
    Token,
    TokenType,
    TokenOpenParen,
    TokenInfixOperator,
    Define,
    OperatorType,
    TokenComma,
    TokenFunction,
} from "./Types";
import { assertNever, err, ok, Result, ResultType } from "../Utils";
import assert from "assert";

const define_to_ast = (op: Define): ASTFunctionCall => {
    switch (op.type) {
        case OperatorType.Binary:
            return {
                type: ASTNodeType.Function,
                def: { arity: Arity.Binary, interpret: op.interpret }
            };
        case OperatorType.NAry:
            return {
                type: ASTNodeType.Function,
                def: {
                    arity: Arity.NAry,
                    nArgs: op.nArgs,
                    interpret: op.interpret
                }
            };
        default:
            assertNever(op);
    }
    throw new Error("Should not get here because of exhaustiveness check");
}

const parse = (builtins: Builtins, tokens: Token[]): Result<string, AST[]> => {
    let output = new Array<AST>();
    let operatorStack = new Array<TokenFunction | TokenOpenParen | TokenInfixOperator>();

    /**
     * Adapted from https://en.wikipedia.org/wiki/Shunting-yard_algorithm
     * Modifications:
     * - Error handling (mismatched parens, undefined operators)
     * - functions
     */
    while (tokens.length > 0) {
        const token = tokens.shift();
        if (token === undefined) { throw new Error("Should not get here beacuse of loop condition") }

        if (token.type === TokenType.Number) {
            output.push({ type: ASTNodeType.Number, value: token.value });
        } else if (token.type === TokenType.Function) {
            operatorStack.push(token);
        } else if (token.type === TokenType.InfixOperator) {
            const opFromNextToken = builtins.definition(token.operator);
            if (opFromNextToken === undefined) { return err(`Operator not defined: "${token.operator}"`); }

            let popping = true;

            while (popping && operatorStack.length > 0) {
                const topOfOperatorStack = operatorStack[operatorStack.length - 1]

                if (topOfOperatorStack.type === TokenType.OpenParen || topOfOperatorStack.type === TokenType.Function) {
                    popping = false;
                } else if (topOfOperatorStack.type === TokenType.InfixOperator) {
                    const opFromTopOfOperatorStack = builtins.definition(topOfOperatorStack.operator);
                    if (opFromTopOfOperatorStack === undefined) { return err(`Operator not defined: "${topOfOperatorStack.operator}"`); }

                    if (opFromTopOfOperatorStack.precedence >= opFromNextToken.precedence) {
                        operatorStack.pop();
                        output.push(define_to_ast(opFromTopOfOperatorStack));
                    } else {
                        popping = false;
                    }
                } else {
                    assertNever(topOfOperatorStack);
                }
            }
            operatorStack.push(token);
        } else if (token.type === TokenType.OpenParen) {
            operatorStack.push(token);
        } else if (token.type === TokenType.CloseParen) {
            let popping = true;
            while (popping && operatorStack.length > 0) {
                const top = operatorStack.pop();
                if (top === undefined) { return err("Mismatched parens!") };
                if (top.type === TokenType.OpenParen) {
                    /* discard the top */
                    popping = false;
                } else if (top.type === TokenType.Function) {
                    const fun = builtins.definition(top.name);
                    if (fun === undefined) { return err(`Function not defined: ${top.name}`); }
                    output.push(define_to_ast(fun));
                } else if (top.type === TokenType.InfixOperator) {
                    const op = builtins.definition(top.operator);
                    if (op === undefined) { return err("Operator not defined!") }
                    output.push(define_to_ast(op));
                }
                else {
                    assertNever(top);
                }
            }
        } else if (token.type === TokenType.Comma) {
            let popping = true;
            while (popping && operatorStack.length > 0) {
                const top = operatorStack.pop();
                if (top === undefined) { throw new Error("Cannot get here because of loop condition"); }

                if (top.type === TokenType.InfixOperator) {
                    const op = builtins.definition(top.operator);
                    if (op === undefined) { return err("Operator not defined!") }
                    output.push(define_to_ast(op));
                } else if (top.type === TokenType.OpenParen || top.type === TokenType.Function) {
                    operatorStack.push(top);
                    popping = false;
                } else {
                    assertNever(top);
                }
            }
        }
        else {
            assertNever(token);
        }
    }

    while (operatorStack.length > 0) {
        const o = operatorStack.pop();
        if (o === undefined) { throw new Error("Should not get here beacuse of loop condition") }
        if (o.type === TokenType.OpenParen) { return err("Mismatched parens!") }
        else if (o.type === TokenType.Function) {
            const op = builtins.definition(o.name);
            if (op === undefined) { return err(`Operator not defined: "${o.name}"`); }
            output.push(define_to_ast(op));
        } else if (o.type === TokenType.InfixOperator) {
            const op = builtins.definition(o.operator);
            if (op === undefined) { return err(`Operator not defined: "${o.operator}"`); }
            output.push(define_to_ast(op));
        } else {
            assertNever(o);
        }
    }

    return ok(output);
}

const evalFunction = (stack: Array<number>, operator: ASTFunctionDef): Result<string, { nextStack: Array<number>, result: number }> => {
    switch (operator.arity) {
        case Arity.Binary:
            const right = stack.pop();
            const left = stack.pop();
            if (left === undefined || right === undefined) { return err("Stack underflow!"); }
            return ok({ nextStack: stack, result: operator.interpret(left, right) });
        case Arity.NAry:
            let args = [];
            for (let i = 0; i < operator.nArgs; i++) {
                const top = stack.pop();
                if (top === undefined) { return err("Stack underflow!"); }
                args.unshift(top);
            }
            return ok({ nextStack: stack, result: operator.interpret(args) });
        default:
            assertNever(operator);
    }
    throw new Error("Should not get here because of assertNever");
}

// https://stackoverflow.com/a/40329913
const evaluate = (ast: AST[]): Result<string, number> => {
    let stack = new Array<number>();
    while (ast.length > 0) {
        const node = ast.shift();
        if (node === undefined) { throw new Error("Should not get here because of loop condition"); }
        switch (node.type) {
            case ASTNodeType.Number:
                stack.push(node.value);
                break;
            case ASTNodeType.Function:
                const res = evalFunction(stack, node.def);
                if (res.type === ResultType.Error) {
                    return res;
                }
                const { nextStack, result } = res.value;
                stack = nextStack;
                stack.push(result);
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
    defines: Define[] = []

    infix = (op: string, precedence: number, interpret: (left: number, right: number) => number): Builtins => {
        assert(precedence > 0
            && Number.isInteger(precedence)
            && Number.isFinite(precedence), "Precedence must be a finite, positive integer");
        this.defines.push({
            type: OperatorType.Binary,
            precedence,
            op,
            interpret
        });
        return this;
    }

    define = (name: string, arity: number, interpret: (args: number[]) => number): Builtins => {
        const interpretI = (args: number[]): number => {
            assert(args.length === arity, "Number of arguments does not match the given arity!");
            return interpret(args);
        }

        this.defines.push({
            type: OperatorType.NAry,
            precedence: 0,
            op: name,
            nArgs: arity,
            interpret: interpretI
        });

        return this;
    }

    definition = (op: string): Define | undefined => this.defines.find(def => def.op === op);
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