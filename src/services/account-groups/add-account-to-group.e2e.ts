import { expect } from '@jest/globals';
import * as helpers from '@tests/helpers';

describe('Add account to group', () => {
  let account, group;

  beforeEach(async () => {
    account = await helpers.createAccount({ raw: true });
    group = await helpers.createAccountGroup({ name: 'test', raw: true });
  });

  it('successfully adds account to group', async () => {
    const result = await helpers.addAccountToGroup({
      accountId: account.id,
      groupId: group.id,
    });

    expect(result.statusCode).toBe(201);
  });

  it('fails when account does not exist', async () => {
    const result = await helpers.addAccountToGroup({
      accountId: 9999,
      groupId: group.id,
    });

    expect(result.statusCode).toBe(404);
  });

  it('fails when group does not exist', async () => {
    const result = await helpers.addAccountToGroup({
      accountId: account.id,
      groupId: 9999,
    });

    expect(result.statusCode).toBe(404);
  });

  it('does not allow duplicate entries', async () => {
    await helpers.addAccountToGroup({
      accountId: account.id,
      groupId: group.id,
    });

    const result = await helpers.addAccountToGroup({
      accountId: account.id,
      groupId: group.id,
    });

    expect(result.statusCode).toBe(409);
  });
});
