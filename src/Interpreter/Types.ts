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
    def: ASTFunctionDef;
}

export enum Arity {
    Binary,
    NAry
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

export type ASTFunctionDef
    = BinaryFunction
// | NAryFunction soon...

export type AST
    = ASTNumber
    | ASTFunctionCall
    ;

export enum OperatorType {
    Binary
}

interface OperatorBase {
    type: OperatorType;
    op: string;
    precedence: number;
}

export interface BinaryOperator extends OperatorBase {
    type: OperatorType.Binary;
    interpret: (left: number, right: number) => number;
}

export interface NAryOperator extends OperatorBase {
    nArgs: number;
    interpret: (operands: number[]) => number;
}

export type Operator
    = BinaryOperator
// | NAryOperator to be added with functions

export interface Builtins {
    infix: (op: string, precedence: number, interpret: (left: number, right: number) => number) => Builtins;

    definition: (op: string) => Operator | undefined;
}