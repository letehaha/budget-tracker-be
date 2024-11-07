/**
 * Helper function for paginating data (typically from an API)
 */
export async function paginate<TData>({
  fetchData,
  pageSize,
  delay,
}: {
  fetchData: (offset: number, count: number) => Promise<TData[]>;
  pageSize: number;
  delay?: { onDelay: (message: string) => void; milliseconds: number };
}): Promise<TData[]> {
  const result: TData[] = [];
  let offset = 0;
  let data: TData[] = [];

  do {
    // fetch one page of data
    data = await fetchData(offset, pageSize);

    // yield each item in the page (lets the async iterator move through one page of data)
    result.push(...data);

    // increase the offset by the page count so the next iteration fetches fresh data
    offset += pageSize;

    if (delay && data.length >= pageSize) {
      delay.onDelay(`Waiting ${delay.milliseconds / 1000} seconds`);
      await new Promise((resolve) => setTimeout(resolve, delay.milliseconds));
    }
  } while (data.length >= pageSize);

  return result;
}

/**
 * Helper function for paginating data with a next data url
 */
export async function paginateWithNextUrl<TData>({
  fetchData,
  pageSize,
  delay,
}: {
  fetchData: (
    limit: number,
    nextCursor: string | undefined,
  ) => Promise<{ data: TData[]; nextUrl: string | undefined }>;
  pageSize: number;
  delay?: { onDelay: (message: string) => void; milliseconds: number };
}): Promise<TData[]> {
  let hasNextPage = true;
  let nextCursor: string | undefined = undefined;
  const result: TData[] = [];

  while (hasNextPage) {
    const response: { data: TData[]; nextUrl: string | undefined } = await fetchData(
      pageSize,
      nextCursor,
    );
    const data = response.data;
    const nextUrl: string | undefined = response.nextUrl ?? undefined;

    try {
      nextCursor = nextUrl ? new URL(nextUrl).searchParams.get('cursor') ?? undefined : undefined;
    } catch {
      nextCursor = undefined;
    }

    result.push(...data);

    hasNextPage = !!nextCursor;

    if (delay) {
      delay.onDelay(`Waiting ${delay.milliseconds / 1000} seconds`);
      await new Promise((resolve) => setTimeout(resolve, delay.milliseconds));
    }
  }

  return result;
}

/**
 * Wraps a function with basic retry logic
 */
export async function withRetry<TResult>(
  fn: (attempt: number) => TResult | Promise<TResult>,
  {
    maxRetries = 10,
    onError,
    delay,
  }: {
    maxRetries?: number;
    onError?(error: unknown, attempt: number): boolean | undefined; // true = retry, false = stop
    delay?: number; // milliseconds
  } = {},
) {
  let retries = 0;
  let lastError: unknown;

  while (retries <= maxRetries) {
    if (delay && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const res = await fn(retries);
      return res;
    } catch (err) {
      lastError = err;

      if (onError) {
        const shouldRetry = onError(err, retries);
        if (!shouldRetry) {
          break;
        }
      }

      retries++;
    }
  }

  throw lastError;
}
