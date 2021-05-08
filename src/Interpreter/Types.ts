export enum TokenType {
    Number,
    InfixOperator,
    Function,
    OpenParen,
    CloseParen,
    Comma,
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

export interface TokenComma {
    type: TokenType.Comma;
}

export interface TokenInfixOperator {
    type: TokenType.InfixOperator;
    operator: string;
}

export interface TokenFunction {
    type: TokenType.Function;
    name: string;
}

export type Token
    = TokenNumber
    | TokenInfixOperator
    | TokenFunction
    | TokenOpenParen
    | TokenCloseParen
    | TokenComma
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
    | NAryFunction
    ;

export type AST
    = ASTNumber
    | ASTFunctionCall
    ;

export enum OperatorType {
    Binary,
    NAry
}

interface DefineBase {
    type: OperatorType;
    op: string;
    precedence: number;
}

export interface DefineBinaryOperator extends DefineBase {
    type: OperatorType.Binary;
    interpret: (left: number, right: number) => number;
}

export interface DefineFunction extends DefineBase {
    type: OperatorType.NAry;
    nArgs: number;
    interpret: (operands: number[]) => number;
}

export type Define
    = DefineBinaryOperator
    | DefineFunction
    ;

export interface Builtins {
    infix: (op: string, precedence: number, interpret: (left: number, right: number) => number) => Builtins;
    define: (name: string, arity: number, interpret: (args: number[]) => number) => Builtins;

    definition: (op: string) => Define | undefined;
}