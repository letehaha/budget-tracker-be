import { expect } from '@jest/globals';
import * as helpers from '@tests/helpers';

describe('Remove account from group', () => {
  let account, group;

  beforeEach(async () => {
    account = await helpers.createAccount({ raw: true });
    group = await helpers.createAccountGroup({ name: 'test', raw: true });
  });

  it('successfully removes account from group', async () => {
    await helpers.addAccountToGroup({
      accountId: account.id,
      groupId: group.id,
    });

    const result = await helpers.removeAccountFromGroup({
      accountId: account.id,
      groupId: group.id,
    });

    expect(result.statusCode).toBe(200);
  });

  it('fails when trying to remove non-existing account', async () => {
    const result = await helpers.removeAccountFromGroup({
      accountId: 9999,
      groupId: group.id,
    });

    expect(result.statusCode).toBe(404);
  });

  it('does not fails when trying to remove non-existing match', async () => {
    await helpers.addAccountToGroup({
      accountId: account.id,
      groupId: group.id,
    });

    await helpers.removeAccountFromGroup({
      accountId: account.id,
      groupId: group.id,
    });

    const result = await helpers.removeAccountFromGroup({
      accountId: account.id,
      groupId: group.id,
    });

    expect(result.statusCode).toBe(200);
  });
});
