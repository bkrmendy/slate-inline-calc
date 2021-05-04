export enum TokenType {
    Number,
    OpenParen,
    CloseParen,
    Operator
};

export interface TokenNumber {
    type: TokenType.Number;
    value: number;
}

export interface TokenOpenParen {
    type: TokenType.OpenParen;
}

export interface TokenCloseParen {
    type: TokenType.CloseParen;
}

export interface TokenOperator {
    type: TokenType.Operator;
    operator: string;
}

export type Token
    = TokenNumber
    | TokenOpenParen
    | TokenCloseParen
    | TokenOperator
    ;

export enum ASTNodeType {
    Number,
    Function
}

export interface ASTNumber {
    type: ASTNodeType.Number;
    value: number;
}

export interface ASTFunctionCall {
    type: ASTNodeType.Function;
    arity: number;
    def: ASTFunctionDef;
}

export enum Arity {
    Unary,
    Binary,
    NAry
}

export interface UnaryFunction {
    arity: Arity.Unary
    interpret: (operand: number) => number;
}

export interface BinaryFunction {
    arity: Arity.Binary
    interpret: (left: number, right: number) => number;
}

export interface NAryFunction {
    arity: Arity.NAry
    nArgs: Number;
    interpret: (operands: number[]) => number;
}

export type ASTFunctionDef = UnaryFunction | BinaryFunction | NAryFunction

export type AST
    = ASTNumber
    | ASTFunctionCall
    ;


interface OperatorBase {
    op: string;
    precedence: number;
}

export interface UnaryOperator extends OperatorBase {
    interpret: (operand: number) => number;
}

export interface BinaryOperator extends OperatorBase {
    interpret: (left: number, right: number) => number;
}

export interface NAryOperator extends OperatorBase {
    nArgs: number;
    interpret: (operands: number[]) => number;
}

export type Operator = UnaryOperator | BinaryOperator | NAryOperator

export interface Builtins {
    prefix: (operator: UnaryOperator) => Builtins;
    infix: (operator: BinaryOperator) => Builtins;
    define: (fn: NAryOperator) => Builtins;
}