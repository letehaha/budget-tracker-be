import { expect } from '@jest/globals';
import { addSeconds } from 'date-fns';
import { ERROR_CODES } from '@js/errors';
import * as helpers from '@tests/helpers';
import { SECURITIES_LOCK_TIME_SECONDS } from './sync-securities';

describe('Sync securities', () => {
  it('checking syncing status returns nothing if not syncing', async () => {
    const status = await helpers.getSyncSecuritiesStatus({
      raw: true,
    });

    expect(status).toMatchObject(
      expect.objectContaining({
        lastSyncTime: null,
        nextSyncTime: null,
        isCurrentlySyncing: false,
      }),
    );
  });
  it('syncing creates data from scratch and blocks new syncing requests', async () => {
    const securitiesListBefore = await helpers.getSecuritiesList({
      raw: true,
    });

    expect(securitiesListBefore.length).toBe(0);

    const syncingPromise = helpers.syncSecuritiesData();

    // Wait a bit so previous request can start
    await new Promise((resolve) => setTimeout(resolve, 10));

    const status = await helpers.getSyncSecuritiesStatus({
      raw: true,
    });

    expect(status).toMatchObject(
      expect.objectContaining({
        lastSyncTime: expect.any(String),
        nextSyncTime: expect.any(String),
        isCurrentlySyncing: true,
      }),
    );

    const newSyncRequest = await helpers.syncSecuritiesData();
    expect(newSyncRequest.statusCode).toBe(ERROR_CODES.Locked);

    await syncingPromise;

    const securitiesListAfter = await helpers.getSecuritiesList({
      raw: true,
    });
    expect(securitiesListAfter.length).toBe(11129);
  }, 25_000);

  it.skip('syncing becomes available after 12 hours', async () => {
    // Initial sync
    await helpers.syncSecuritiesData();

    // Attempt to sync immediately after (should be locked)
    const lockedSyncResponse = await helpers.syncSecuritiesData();
    expect(lockedSyncResponse.statusCode).toBe(ERROR_CODES.Locked);
    const currentDate = new Date();

    // Go SECURITIES_LOCK_TIME_SECONDS into the future
    jest.useFakeTimers();
    jest.setSystemTime(addSeconds(new Date(currentDate), SECURITIES_LOCK_TIME_SECONDS).getTime());

    // Check status
    const status = await helpers.getSyncSecuritiesStatus({
      raw: true,
    });

    expect(status.isCurrentlySyncing).toBe(false);

    // Attempt to sync again after SECURITIES_LOCK_TIME_SECONDS
    const syncAfter12Hours = await helpers.syncSecuritiesData();
    // Expect the sync to be successful (not locked)
    expect(syncAfter12Hours.statusCode).toBe(200);

    // Verify the sync status
    const statusAfter12Hours = await helpers.getSyncSecuritiesStatus({ raw: true });
    expect(statusAfter12Hours).toMatchObject({
      lastSyncTime: expect.any(String),
      nextSyncTime: expect.any(String),
      isCurrentlySyncing: false,
    });

    // Clean up the mock
    jest.useRealTimers();
  }, 30_000);
});
