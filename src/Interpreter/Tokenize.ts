import assert from "assert";
import { err, ok, Result, ResultType } from "../Utils";
import { Token, TokenCloseParen, TokenComma, TokenNumber, TokenOpenParen, TokenInfixOperator, TokenType, TokenFunction } from "./Types";

const isString = (a: string) => (b: string) => a === b;
const isOneOf = (elems: string[]) => (e: string) => elems.includes(e);
const isDigit = isOneOf(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]);
const isWhiteSpace = isOneOf([" ", "\t", "\n", ","]); // comma is whitespace for practical purposes

const isOpenParen = isString("(");
const isCloseParen = isString(")");
const isComma = isString(",");

const toNumber = (literal: string) => parseFloat(literal);

const isOperatorChar = isOneOf(["%", "*", "+", "-", "^", "/"]);

const isFunctionChar = (c: string) => {
    const isLowerCaseLetter = "a".charCodeAt(0) <= c.charCodeAt(0) && c.charCodeAt(0) <= "z".charCodeAt(0);
    return isLowerCaseLetter;
}

const signFn = (sign: '+' | '-') => (n: number) => sign === '-' ? -n : n;

type ParsedToken<T extends Token> = { to: number, token: T }

// parse number from indexes [from, to)
export const parseNumber = (from: number, source: string): Result<string, ParsedToken<TokenNumber>> => {
    assert(!isWhiteSpace(source[from]));

    // 1. parse optional leading +/-
    let sign = signFn('+');
    const maybeSignChar = source[from];
    if (maybeSignChar === '+' || maybeSignChar === '-') {
        sign = signFn(maybeSignChar);
        from += 1;
    } else {
        /* No sign char present */
    }

    // 2. parse whole part of number
    let to = from;
    while (to < source.length && isDigit(source[to])) {
        to += 1;
    }

    if (to === from) {
        return err("No digit after sign");
    }

    let wholePart = source.slice(from, to);

    from = to;

    // 3. parse optional decimal point
    if (source[from] !== '.') {
        const number = toNumber(wholePart);
        return ok({ to, token: { type: TokenType.Number, value: sign(number) } });
    } else {
        /* skip over decimal point if present */
        to += 1;
    }

    from = to;

    // 4. parse fractional part of number
    while (to < source.length && isDigit(source[to])) {
        to += 1;
    }
    if (to === from) {
        return err(`Character is not a digit: ${source[from]}`);
    }
    const fractionalPart = source.slice(from, to);
    const number = parseFloat(`${wholePart}.${fractionalPart}`);
    return ok({ to, token: { type: TokenType.Number, value: sign(number) } });
}

const parseInfixOperator = (from: number, source: string): Result<null, ParsedToken<TokenInfixOperator>> => {
    assert(!isWhiteSpace(source[from]));
    let to = from;
    while (to < source.length && isOperatorChar(source[to])) {
        to += 1;
    }
    if (to === from) {
        return err(null);
    }
    return ok({ to, token: { type: TokenType.InfixOperator, operator: source.slice(from, to) } });
}

const parseFunctionName = (from: number, source: string): Result<null, ParsedToken<TokenFunction>> => {
    assert(!isWhiteSpace(source[from]));
    let to = from;
    while (to < source.length && isFunctionChar(source[to])) {
        to += 1;
    }

    if (from === to) {
        return err(null);
    }

    return ok({ to, token: { type: TokenType.Function, name: source.slice(from, to) } });
}

const parseParen = (from: number, source: string): Result<null, ParsedToken<TokenOpenParen | TokenCloseParen>> => {
    assert(!isWhiteSpace(source[from]));
    if (isOpenParen(source[from])) {
        return ok({ to: from + 1, token: { type: TokenType.OpenParen } });
    }
    if (isCloseParen(source[from])) {
        return ok({ to: from + 1, token: { type: TokenType.CloseParen } });
    }
    return err(null);
}

const parseComma = (from: number, source: string): Result<null, ParsedToken<TokenComma>> => {
    assert(!isWhiteSpace(source[from]));
    if (isComma(source[from])) {
        return ok({ to: from + 1, token: { type: TokenType.Comma } })
    }
    return err(null);

}

const accept = <T extends Token>(t: ParsedToken<T>): Result<string, ParsedToken<T>> => {
    const { to, token } = t;
    return ok({ to, token });
}

const parseToken = (from: number, source: string): Result<string, ParsedToken<Token>> => {
    assert(from < source.length);
    while (from < source.length && isWhiteSpace(source[from])) {
        from += 1;
    }

    const maybeNumber = parseNumber(from, source);
    if (maybeNumber.type === ResultType.OK) {
        return accept(maybeNumber.value);
    }

    const maybeOperator = parseInfixOperator(from, source);
    if (maybeOperator.type === ResultType.OK) {
        return accept(maybeOperator.value);
    }

    const maybeFunctionName = parseFunctionName(from, source);
    if (maybeFunctionName.type === ResultType.OK) {
        return accept(maybeFunctionName.value);
    }

    const maybeParen = parseParen(from, source);
    if (maybeParen.type === ResultType.OK) {
        return accept(maybeParen.value);
    }

    const maybeComma = parseComma(from, source);
    if (maybeComma.type === ResultType.OK) {
        return accept(maybeComma.value);
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
        } else {
            return err(maybeNextToken.error);
        }
    }
    return ok(tokens);
}