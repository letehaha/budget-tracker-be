import axios from 'axios';
import config from 'config';
import PQueue from 'p-queue';
import {
  addMonths,
  endOfMonth,
  startOfMonth,
  differenceInCalendarMonths,
} from 'date-fns';
import {
  API_ERROR_CODES,
  API_RESPONSE_STATUS,
  TRANSACTION_TYPES,
  PAYMENT_TYPES,
  endpointsTypes,
  ExternalMonobankClientInfoResponse,
  ExternalMonobankTransactionResponse,
  AccountModel,
  ACCOUNT_TYPES,
} from 'shared-types';
import { CustomResponse } from '@common/types';

import * as accountsService from '@services/accounts.service';
import * as transactionsService from '@services/transactions';
import * as usersService from '@services/user.service';
import * as monobankUsersService from '@services/banks/monobank/users';

import { connection } from '@models/index';
import * as MerchantCategoryCodes from '@models/MerchantCategoryCodes.model';
import * as UserMerchantCategoryCodes from '@models/UserMerchantCategoryCodes.model';
import * as Users from '@models/Users.model';

import { logger} from '@js/utils/logger';

const usersQuery = new Map();

const hostWebhooksCallback = config.get('hostWebhooksCallback');
const apiPrefix = config.get('apiPrefix');
const hostname = config.get('bankIntegrations.monobank.apiEndpoint');

function dateRange(
  { from, to }: { from: number; to: number; }
): { start: number; end: number }[] {
  const difference = differenceInCalendarMonths(
    new Date(to),
    new Date(from),
  );
  const dates = [];

  for (let i = 0; i <= difference; i++) {
    const start = startOfMonth(addMonths(new Date(from), i));
    const end = endOfMonth(addMonths(new Date(from), i));

    dates.push({
      start: Number((new Date(start).getTime() / 1000).toFixed(0)),
      end: Number((new Date(end).getTime() / 1000).toFixed(0)),
    });
  }

  return dates;
}

async function updateWebhookAxios({ userToken }: { userToken?: string } = {}) {
  await axios({
    method: 'POST',
    url: `${hostname}/personal/webhook`,
    responseType: 'json',
    headers: {
      'X-Token': userToken,
    },
    data: {
      webHookUrl: `${hostWebhooksCallback}${apiPrefix}/banks/monobank/webhook`,
    },
  });
}

async function createMonoTransaction(
  { data, account, userId }:
  { data: ExternalMonobankTransactionResponse, account: AccountModel, userId: number },
  // attributes: GenericSequelizeModelAttributes = {},
) {
  const isTransactionExists = await transactionsService.getTransactionBySomeId({
    originalId: data.id,
    userId,
  });

  if (isTransactionExists) return;

  const userData = await usersService.getUser(account.userId);

  let mccId = await MerchantCategoryCodes.getByCode({ code: data.mcc });

  // check if mcc code exist. If not, create a new with name 'Unknown'
  if (!mccId) {
    mccId = await MerchantCategoryCodes.addCode({ code: data.mcc });
  }

  const userMcc = await UserMerchantCategoryCodes.getByPassedParams({
    mccId: mccId.get('id'),
    userId: userData.id,
  });

  let categoryId;

  if (userMcc.length) {
    categoryId = userMcc[0].get('categoryId');
  } else {
    categoryId = (
      await Users.getUserDefaultCategory({ id: userData.id })
    ).get('defaultCategoryId');

    await UserMerchantCategoryCodes.createEntry({
      mccId: mccId.get('id'),
      userId: userData.id,
      categoryId,
    });
  }

  await transactionsService.createTransaction({
    originalId: data.id,
    note: data.description,
    amount: data.amount,
    time: new Date(data.time * 1000),
    externalData: {
      operationAmount: data.operationAmount,
      receiptId: data.receiptId,
      balance: data.balance,
      hold: data.hold,
    },
    commissionRate: data.commissionRate,
    cashbackAmount: data.cashbackAmount,
    accountId: account.id,
    userId: userData.id,
    transactionType: data.amount > 0 ? TRANSACTION_TYPES.income : TRANSACTION_TYPES.expense,
    paymentType: PAYMENT_TYPES.creditCard,
    categoryId,
    isTransfer: false,
    accountType: ACCOUNT_TYPES.monobank,
  });

  // eslint-disable-next-line no-console
  logger.info(`New MONOBANK transaction! Amount is ${data.amount}`);
}

export const pairAccount = async (req, res: CustomResponse) => {
  const { token }: endpointsTypes.PairMonobankAccountBody = req.body;
  let { id: systemUserId }: { id: number; } = req.user;
  systemUserId = Number(systemUserId)

  try {
    const result = await accountsService.pairMonobankAccount({ token, userId: systemUserId })

    if ('connected' in result && result.connected) {
      return res.status(404).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: 'Account already connected',
          code: API_ERROR_CODES.monobankUserAlreadyConnected,
        },
      });
    }

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: result,
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const getUser = async (req, res: CustomResponse) => {
  const { id } = req.user;

  try {
    const user = await monobankUsersService.getUserBySystemId({
      systemUserId: Number(id),
    });

    if (!user) {
      return res.status(404).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: 'Current user does not have any paired monobank user.',
          code: API_ERROR_CODES.monobankUserNotPaired,
        },
      });
    }

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: user,
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const updateUser = async (req, res: CustomResponse) => {
  const { id: systemUserId } = req.user;
  const { apiToken, name, webHookUrl, clientId }: endpointsTypes.UpdateMonobankUserBody = req.body;

  try {
    const user = await monobankUsersService.updateUser({
      systemUserId,
      apiToken,
      name,
      webHookUrl,
      clientId,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: user,
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

// TODO:
// export const monobankWebhook = async (req, res: CustomResponse) => {
//   const { data } = req.body;

//   try {
//     const monobankAccounts = await monobankAccountsService.getAccountsById({
//       accountId: data.account,
//     });
//     if (!monobankAccounts.length) {
//       return res.status(404).json({
//         status: API_RESPONSE_STATUS.error,
//         response: {
//           message: 'Monobank account does not exist!',
//         },
//       });
//     }

//     for (const account of monobankAccounts) {
//       const user = await monobankUsersService.getUserById({ id: account.monoUserId });

//       await createMonoTransaction({
//         data: data.statementItem,
//         account,
//         userId: user.systemUserId,
//       });
//     }

//     return res.status(200).json({
//       status: API_RESPONSE_STATUS.success,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       status: API_RESPONSE_STATUS.error,
//       response: {
//         message: 'Unexpected error.',
//         code: API_ERROR_CODES.unexpected,
//       },
//     });
//   }
// };

// TODO:
export const updateWebhook = async (req, res: CustomResponse) => {
  try {
    const { clientId }: endpointsTypes.UpdateWebhookBody = req.body;
    const { id } = req.user;

    const token = `monobank-${id}-update-webhook`;
    const tempToken = await req.redisClient.get(token);

    if (!tempToken) {
      await monobankUsersService.updateUser({
        systemUserId: id,
        clientId,
        webHookUrl: `${hostWebhooksCallback}${apiPrefix}/banks/monobank/webhook`,
      });

      // TODO: why here we don't pass userToken?
      await updateWebhookAxios();

      await req.redisClient.set(token, true);
      await req.redisClient.expire(token, 60);

      return res.status(200).json({ status: API_RESPONSE_STATUS.success });
    }

    return res.status(429).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Too many requests! Request cannot be called more that once a minute!',
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const loadTransactions = async (req, res: CustomResponse) => {
  try {
    const { from, to, accountId }: endpointsTypes.LoadMonoTransactionsQuery = req.query;
    const { id: systemUserId } = req.user;

    const redisToken = `monobank-${systemUserId}-load-transactions`;
    const tempRedisToken = await req.redisClient.get(redisToken);

    if (tempRedisToken) {
      return res.status(403).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: 'There were too many requests earlier. Please wait at least one minute from when you first saw this message.',
          code: API_ERROR_CODES.forbidden,
        },
      });
    }

    const monobankUser = await monobankUsersService.getUserBySystemId({ systemUserId });

    if (!monobankUser) {
      return res.status(404).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: 'Monobank user does not exist.',
          code: API_ERROR_CODES.notFound,
        },
      });
    }

    // Check mono account exist
    const account = await accountsService.getAccountById({
      id: Number(accountId),
      userId: Number(systemUserId),
    });

    if (!account) {
      return res.status(404).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: 'Monobank account does not exist.',
          code: API_ERROR_CODES.notFound,
        },
      });
    }

    // Check is there already created query for data retrieve
    const existQuery = usersQuery.get(`query-${systemUserId}`);

    if (existQuery) {
      logger.error('[Monobank controller]: Query already exists');

      return res.status(429).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: `
            Query already exist and should be fulfilled first. Number of left
            requests is ${existQuery.size}. Try to request a bit later
            (approximately in ${existQuery.size} minutes, since each request
            will take about 60 seconds)
          `,
          code: API_ERROR_CODES.tooManyRequests,
        },
      });
    }

    // Create queue on data retrieving, get months and add queue to global map
    const queue = new PQueue({
      concurrency: 1,
      interval: 60000,
      intervalCap: 1,
    });
    const months = dateRange({ from: Number(from), to: Number(to) });

    usersQuery.set(`query-${systemUserId}`, queue);

    for (const month of months) {
      queue.add(async () => {
        try {
          const { data }: { data: ExternalMonobankTransactionResponse[] } = await axios({
            method: 'GET',
            url: `${hostname}/personal/statement/${account.externalId}/${month.start}/${month.end}`,
            responseType: 'json',
            headers: {
              'X-Token': monobankUser.apiToken,
            },
          });

          for (const item of data) {
            await createMonoTransaction({
              data: item,
              account,
              userId: systemUserId,
            });
          }
        } catch (err) {
          if (err.response.status === 429) {
            await req.redisClient.set(redisToken, true);
            await req.redisClient.expire(redisToken, 60);

            return res.status(429).json({
              status: API_RESPONSE_STATUS.error,
              response: {
                message: 'Monobank connection error. Too many requests!',
                code: API_ERROR_CODES.tooManyRequests,
              },
            });
          }

          throw err
        }
      });
    }

    // When all requests are done – delete it from the map
    queue.on('idle', () => {
      logger.info(`[Monobank controller]: All load transactions tasks are done. Size: ${queue.size}  Pending: ${queue.pending}`);
      usersQuery.delete(`query-${systemUserId}`);
    });
    queue.on('add', () => {
      logger.info(`[Monobank controller]: Task to load transactions is added. Size: ${queue.size}  Pending: ${queue.pending}`);
    });
    queue.on('next', () => {
      logger.info(`[Monobank controller]: One of load transactions task is completed. Size: ${queue.size}  Pending: ${queue.pending}`);
    });

    return res.status(200).json<endpointsTypes.LoadMonoTransactionsResponse>({
      status: API_RESPONSE_STATUS.success,
      response: {
        minutesToFinish: months.length - 1,
      },
    });
  } catch (err) {
    logger.error(err);

    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const refreshAccounts = async (req, res) => {
  const { id: systemUserId } = req.user;

  const transaction = await connection.sequelize.transaction();

  try {
    const monoUser = await monobankUsersService.getUserBySystemId(
      { systemUserId },
      { transaction },
    );

    if (!monoUser) {
      await transaction.commit();

      return res.status(404).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: 'Current user does not have any paired monobank user.',
          code: API_ERROR_CODES.monobankUserNotPaired,
        },
      });
    }

    const token = `monobank-${systemUserId}-client-info`;
    const tempToken = await req.redisClient.get(token);

    if (!tempToken) {
      let clientInfo: ExternalMonobankClientInfoResponse;
      try {
        clientInfo = (await axios({
          method: 'GET',
          url: `${hostname}/personal/client-info`,
          responseType: 'json',
          headers: {
            'X-Token': monoUser.apiToken,
          },
        })).data;
      } catch (e) {
        await transaction.rollback();

        if (e.response) {
          if (e.response.data.errorDescription === "Unknown 'X-Token'") {
            // Set user token to empty, since it is already invalid. In that way
            // we can let BE/FE know that last token was invalid and now it
            // needs to be updated
            await monobankUsersService.updateUser({ systemUserId, apiToken: '' }, { transaction });

            return res.status(403).json({
              status: API_RESPONSE_STATUS.error,
              response: {
                code: API_ERROR_CODES.monobankTokenInvalid,
                message: "User's token is invalid!",
              },
            });
          }
        }
        return res.status(500).json({
          status: API_RESPONSE_STATUS.error,
          response: {
            message: 'Something bad happened while trying to contact Monobank!',
          },
        });
      }

      await req.redisClient.set(token, true);
      await req.redisClient.expire(token, 60);

      const existingAccounts = await accountsService.getAccountsByExternalIds({
        userId: monoUser.systemUserId,
        externalIds: clientInfo.accounts.map(item => item.id),
      }, { transaction, raw: true })

      const accountsToUpdate = []
      const accountsToCreate = []
      clientInfo.accounts.forEach(account => {
        const existingAccount = existingAccounts.find(acc => acc.externalId === account.id)

        if (existingAccount) {
          accountsToUpdate.push(accountsService.updateAccount({
            id: existingAccount.id,
            currentBalance: account.balance,
            creditLimit: account.creditLimit,
            userId: monoUser.systemUserId,
            // TODO: update externalData
            // maskedPan: JSON.stringify(item.maskedPan),
            // cashbackType: item.cashbackType,
            // type: item.type,
            // iban: item.iban,
          }, { transaction }))
        } else {
          accountsToCreate.push(
            accountsService.createSystemAccountsFromMonobankAccounts({ userId: systemUserId, monoAccounts: [account] }),
          )
        }
      })

      await Promise.all(accountsToUpdate);
      await Promise.all(accountsToCreate);

      const accounts = await accountsService.getAccounts({
        userId: monoUser.systemUserId,
        type: ACCOUNT_TYPES.monobank,
      }, { transaction });

      await transaction.commit();

      return res.status(200).json({
        status: API_RESPONSE_STATUS.success,
        response: accounts,
      });
    }

    await transaction.commit();

    return res.status(429).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        code: API_ERROR_CODES.tooManyRequests,
        message: 'Too many requests! Request cannot be called more that once a minute!',
      },
    });
  } catch (err) {
    await transaction.rollback();

    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};
