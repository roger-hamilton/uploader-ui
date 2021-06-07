import { asyncTramp, AsyncTramp } from "./asyncTramp";

/**
 * Creates an async queue that processes a number of items given a worker to process a single item.
 * Optionally allow `cuncurrency` parrallel workers to process tasks at the same time.
 * @param asyncWorker Async Function that processes one item 
 * @param items Array of items to process
 * @param concurrency Maximum number of concurrent workers running (defaults to 1)
 * @returns Async Array of results in the same order that they were passed in
 * @author Roger Hamilton <roger.max.hamilton@gmail.com>
 */
export const asyncQueue = async <T, R>(
  asyncWorker: (item: T) => Promise<R>,
  items: T[],
  concurrency = 1
): Promise<R[]> => {
  const queueItems = items.map((item, idx) => [idx, item] as const);
  const results = Array<R>(items.length);

  const innerChainNext = async (): Promise<AsyncTramp> => {
    if (queueItems.length) {
      const [idx, item] = queueItems.shift()!;

      const res = await asyncWorker(item);

      results[idx] = res;
      return innerChainNext;
    }
  }

  const chainNext = asyncTramp(innerChainNext);

  await Promise.all([...Array(concurrency)].map(chainNext));

  return results;
}