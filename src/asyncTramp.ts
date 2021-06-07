export type AsyncTramp<T = undefined> = T | AsyncTrampFunc<T>
export type AsyncTrampFunc<T> = () => Promise<T | AsyncTramp<T>>


export const isAsyncTrampFunc = <T>(tramp: AsyncTramp<T>): tramp is AsyncTrampFunc<T> =>
  typeof tramp === 'function';

/**
 * Takes an async recursive function that returns an async thunk that runs it's next iteration.
 * This allows for unlimited depth recursion without stack overflow.
 * @param fn Async Recursive Function to Trampoline
 * @returns Function that accepts the same arguments as fn but returns the final result
 * @author Roger Hamilton <roger.max.hamilton@gmail.com>
 */
export const asyncTramp = <T extends any[], R>(fn: (...args: T) => Promise<R | AsyncTramp<R>>) => {
  return async (...args: T): Promise<R> => {
    let result = await fn(...args);
    while(isAsyncTrampFunc(result)) {
      result = await result();
    }
    return result;
  }
}