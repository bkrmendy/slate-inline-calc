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
    TokenOperator,
    Operator,
    OperatorType,
} from "./Types";
import { assertNever, err, ok, Result, ResultType } from "../Utils";

const operator_to_ast = (op: Operator): ASTFunctionCall => {
    switch (op.type) {
        case OperatorType.Binary:
            return { type: ASTNodeType.Function, def: { arity: Arity.Binary, interpret: op.interpret } };
        default:
            assertNever(op.type);
    }
    throw new Error("Should not get here because of exhaustiveness check");
}

const parse = (builtins: Builtins, tokens: Token[]): Result<string, AST[]> => {
    let output = new Array<AST>();
    let operatorStack = new Array<TokenOpenParen | TokenOperator>();

    // https://en.wikipedia.org/wiki/Shunting-yard_algorithm
    while (tokens.length > 0) {
        const token = tokens.shift();
        if (token === undefined) { throw new Error("Should not get here beacuse of loop condition") }
        
        if (token.type === TokenType.Number) {
            output.push({ type: ASTNodeType.Number, value: token.value });
        } else if (token.type === TokenType.Operator) {
            const opFromNextToken = builtins.definition(token.operator);
            if (opFromNextToken === undefined) { return err(`Operator not defined: "${token.operator}"`); }
        
            let popping = true;
        
            while (popping && operatorStack.length > 0) {
                const topOfOperatorStack = operatorStack[operatorStack.length - 1]
        
                if (topOfOperatorStack.type === TokenType.OpenParen) {
                    popping = false;
                } else if (topOfOperatorStack.type === TokenType.Operator) {
                    const opFromTopOfOperatorStack = builtins.definition(topOfOperatorStack.operator);
                    if (opFromTopOfOperatorStack === undefined) { return err(`Operator not defined: "${topOfOperatorStack.operator}"`); }
                    if (opFromTopOfOperatorStack.precedence >= opFromNextToken.precedence) {
                        operatorStack.pop();
                        output.push(operator_to_ast(opFromTopOfOperatorStack));
                    } else {
                        popping = false;
                    }
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
                } else if (top.type === TokenType.Operator) {
                    const op = builtins.definition(top.operator);
                    if (op === undefined) { return err("Operator not defined!") }
                    output.push(operator_to_ast(op));
                }
            }
        } else {
            assertNever(token);
        }
    }

    while (operatorStack.length > 0) {
        const o = operatorStack.pop();
        if (o === undefined) { throw new Error("Should not get here beacuse of loop condition") }
        if (o.type === TokenType.OpenParen) { return err("Mismatched parens!") }
        else if (o.type === TokenType.Operator) {
            const op = builtins.definition(o.operator);
            if (op === undefined) { return err(`Operator not defined: "${o.operator}"`); }
            output.push(operator_to_ast(op));
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
        default:
            assertNever(operator.arity);
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

    definition = (op: string): Operator | undefined => this.defines.find(def => def.op === op);
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