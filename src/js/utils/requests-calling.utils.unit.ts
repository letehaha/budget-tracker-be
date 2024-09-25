import _ from 'lodash';
import { paginate, withRetry, paginateWithNextUrl } from './requests-calling.utils';

describe('paginate', () => {
  it.each`
    pageSize | dataSize | fetchCalls
    ${10}    | ${0}     | ${1}
    ${10}    | ${1}     | ${1}
    ${10}    | ${10}    | ${2}
    ${10}    | ${11}    | ${2}
    ${10}    | ${20}    | ${3}
  `(
    `paginates correctly: (pageSize: $pageSize, dataSize: $dataSize)`,
    async ({ pageSize, dataSize, fetchCalls }) => {
      const mockFetchData = jest.fn((offset, count) =>
        Promise.resolve(_.slice(_.range(dataSize), offset, offset + count)),
      );

      const result = await paginate({
        pageSize,
        fetchData: mockFetchData,
      });

      expect(result).toHaveLength(dataSize);
      expect(result).toEqual(_.range(dataSize));

      expect(mockFetchData).toHaveBeenCalledTimes(fetchCalls);
      _.range(fetchCalls).map((i) => {
        expect(mockFetchData).toHaveBeenNthCalledWith(i + 1, i * pageSize, pageSize);
      });
    },
  );
});

describe('withRetry', () => {
  it.each`
    failAttempts | maxRetries
    ${0}         | ${5}
    ${1}         | ${5}
    ${2}         | ${5}
    ${5}         | ${5}
  `(
    `retries correctly: (failAttempts: $failAttempts, maxRetries: $maxRetries)`,
    async ({ failAttempts, maxRetries }) => {
      const mock = jest.fn((attempt) => {
        if (attempt < failAttempts) throw new Error(`keep trying!`);
        return 'done';
      });

      await withRetry(mock, { maxRetries });

      expect(mock).toHaveBeenCalledTimes(failAttempts + 1);
      _.range(failAttempts + 1).map((i) => {
        expect(mock).toHaveBeenNthCalledWith(i + 1, i);
      });
    },
  );

  it(`throws last error`, async () => {
    const maxRetries = 5;

    const mock = jest.fn((attempt) => {
      throw new Error(`keep trying! attempt: ${attempt}`);
    });

    expect(withRetry(mock, { maxRetries })).rejects.toThrow();
    expect(mock).toHaveBeenCalledTimes(maxRetries + 1);
  });

  it(`obeys onError poison pill`, async () => {
    const maxRetries = 5;
    const exitAfterAttempts = 1;

    const mock = jest.fn((attempt) => {
      throw new Error(`keep trying! attempt: ${attempt}`);
    });

    const mockOnError = jest.fn((_err, attempt) => attempt < exitAfterAttempts);

    expect(withRetry(mock, { maxRetries, onError: mockOnError })).rejects.toThrow();
    expect(mock).toHaveBeenCalledTimes(exitAfterAttempts + 1);
    expect(mockOnError).toHaveBeenCalledTimes(exitAfterAttempts + 1);
  });
});

describe('paginateWithNextUrl', () => {
  const mockData = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    // ... add more mock data as needed
  ];

  const mockFetchData = jest.fn();

  beforeEach(() => {
    mockFetchData.mockReset();
  });

  it('should paginate correctly over multiple pages', async () => {
    mockFetchData
      .mockResolvedValueOnce({
        data: [mockData[0]],
        nextUrl: 'http://example.com?cursor=2',
      })
      .mockResolvedValueOnce({ data: [mockData[1]], nextUrl: undefined });

    const result = await paginateWithNextUrl({
      fetchData: mockFetchData,
      pageSize: 1,
    });

    expect(result).toEqual(mockData);
    expect(mockFetchData).toHaveBeenCalledTimes(2);
  });

  it('should handle the case with no next page', async () => {
    mockFetchData.mockResolvedValueOnce({
      data: [mockData[0]],
      nextUrl: undefined,
    });

    const result = await paginateWithNextUrl({
      fetchData: mockFetchData,
      pageSize: 1,
    });

    expect(result).toEqual([mockData[0]]);
    expect(mockFetchData).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when fetchData fails', async () => {
    mockFetchData.mockRejectedValue(new Error('Fetch error'));

    await expect(
      paginateWithNextUrl({
        fetchData: mockFetchData,
        pageSize: 1,
      }),
    ).rejects.toThrow('Fetch error');
  });

  it('should return an empty array for empty data response', async () => {
    mockFetchData.mockResolvedValueOnce({ data: [], nextUrl: undefined });

    const result = await paginateWithNextUrl({
      fetchData: mockFetchData,
      pageSize: 1,
    });

    expect(result).toEqual([]);
    expect(mockFetchData).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid nextUrl correctly', async () => {
    mockFetchData
      .mockResolvedValueOnce({ data: [mockData[0]], nextUrl: 'invalidUrl' }) // Invalid URL
      .mockResolvedValueOnce({ data: [mockData[1]], nextUrl: undefined });

    const result = await paginateWithNextUrl({
      fetchData: mockFetchData,
      pageSize: 1,
    });

    expect(result).toEqual([mockData[0]]); // Only the first page data should be returned
    expect(mockFetchData).toHaveBeenCalledTimes(1);
  });

  it('should respect the pageSize parameter', async () => {
    const pageSize = 2;
    mockFetchData.mockResolvedValueOnce({
      data: mockData.slice(0, pageSize),
      nextUrl: undefined,
    });

    const result = await paginateWithNextUrl({
      fetchData: mockFetchData,
      pageSize,
    });

    expect(result).toEqual(mockData.slice(0, pageSize));
    expect(mockFetchData).toHaveBeenCalledWith(pageSize, undefined);
  });

  it('should accumulate results correctly over multiple pages', async () => {
    mockFetchData
      .mockResolvedValueOnce({
        data: [mockData[0]],
        nextUrl: 'http://example.com?cursor=2',
      })
      .mockResolvedValueOnce({ data: [mockData[1]], nextUrl: undefined });

    const result = await paginateWithNextUrl({
      fetchData: mockFetchData,
      pageSize: 1,
    });

    expect(result).toEqual([mockData[0], mockData[1]]);
  });

  it('should work correctly without delay parameter', async () => {
    mockFetchData.mockResolvedValueOnce({ data: mockData, nextUrl: undefined });

    const result = await paginateWithNextUrl({
      fetchData: mockFetchData,
      pageSize: mockData.length,
    });

    expect(result).toEqual(mockData);
  });
});
