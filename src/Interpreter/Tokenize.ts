import { err, ok, Result, ResultType } from "../Utils";
import { Token, TokenType } from "./Types";

const isString = (a: string) => (b: string) => a === b;
const isOneOf = (elems: string[]) => (e: string) => elems.includes(e);
const isDigit = isOneOf(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]);
const isWhiteSpace = isOneOf([" ", "\t", "\n", ","]); // comma is whitespace for practical purposes

const isOpenParen = isString("(");
const isCloseParen = isString(")");

const toNumber = (literal: string) => parseFloat(literal);

const isOperatorChar = isOneOf(["%", "*", "+", "-", "^", "/"]);

const isFunctionChar = (c: string) => {
    const isLowerCaseLetter = "a".charCodeAt(0) <= c.charCodeAt(0) && c.charCodeAt(0) <= "z".charCodeAt(0);
    const isUpperCaseLetter = "A".charCodeAt(0) <= c.charCodeAt(0) && c.charCodeAt(0) <= "Z".charCodeAt(0);
    return isLowerCaseLetter || isUpperCaseLetter;
}

// parse number from indexes [from, to)
const parseNumber = (from: number, source: string): Result<null, { to: number, value: number }> => {
    /*
        TODO
        Grammar for number:
        ('-'|'+')?<digit+>(.)?<digit+>
        -123.312
    */

    let to = from;
    while (to < source.length && isDigit(source[to])) {
        to += 1;
    }
    if (to === from) {
        return err(null);
    }
    const literal = source.slice(from, to);
    return ok({ to, value: toNumber(literal) });
}

const parseOperator = (from: number, source: string): Result<null, { to: number, value: string }> => {
    let to = from;
    while (to < source.length && isOperatorChar(source[to])) {
        to += 1;
    }
    if (to === from) {
        return err(null);
    }
    return ok({ to, value: source.slice(from, to) });
}

const parseParen = (from: number, source: string): Result<null, { to: number, token: Token }> => {
    if (isOpenParen(source[from])) {
        return ok({ to: from + 1, token: { type: TokenType.OpenParen } });
    }
    if (isCloseParen(source[from])) {
        return ok({ to: from + 1, token: { type: TokenType.CloseParen } });
    }
    return err(null);
}

const parseToken = (from: number, source: string): Result<string, { to: number, token: Token }> => {
    while (isWhiteSpace(source[from])) {
        from += 1;
    }

    const maybeNumber = parseNumber(from, source);
    if (maybeNumber.type === ResultType.OK) {
        const token: Token = { type: TokenType.Number, value: maybeNumber.value.value };
        return ok({ to: maybeNumber.value.to, token });
    }

    const maybeOperator = parseOperator(from, source);
    if (maybeOperator.type === ResultType.OK) {
        const token: Token = { type: TokenType.Operator, operator: maybeOperator.value.value };
        return ok({ to: maybeOperator.value.to, token });
    }

    const maybeParen = parseParen(from, source);
    if (maybeParen.type === ResultType.OK) {
        return ok({ to: maybeParen.value.to, token: maybeParen.value.token });
    }

    return err(`Unexpected character: ${source[from]}`);
}

export const tokenize = (source: string): Result<string, Token[]> => {
    let tokens: Token[] = []
    let currentIndex = 0;
    while (currentIndex < source.length) {
        const maybeNextToken = parseToken(currentIndex, source);
        if (maybeNextToken.type === ResultType.OK) {
            currentIndex = maybeNextToken.value.to;
            tokens.push(maybeNextToken.value.token);
        }
    }
    return ok(tokens);
}