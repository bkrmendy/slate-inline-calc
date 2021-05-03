export enum ResultType {
    Error,
    OK
}

export interface ResultError<E> {
    type: ResultType.Error;
    error: E;
}

export interface ResultOK<T> {
    type: ResultType.OK;
    value: T;
}

export type Result<E, T> = ResultError<E> | ResultOK<T>;

export const ok = <E, T>(t: T): Result<E, T> => ({ type: ResultType.OK, value: t });
export const err = <E, T>(e: E): Result<E, T> => ({ type: ResultType.Error, error: e });

export const assertNever = (_: never) => { /* never gets here */ };