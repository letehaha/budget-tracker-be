// import { Op } from 'sequelize';
// import { TRANSACTION_TYPES, ACCOUNT_TYPES } from 'shared-types';
// import Balances from './models/Balances.model';
// import Accounts from './models/Accounts.model';
// import { TransactionsAttributes } from '@models/Transactions.model';
// import * as BalancesModel from '@models/Balances.model';

// export async function updateBalanceOnTransactionChange({
//   accountId,
//   accountType,
//   transactionType,
//   refAmount,
//   time,
//   externalData,
//   prevAccountId,
//   prevTransactionType,
//   prevRefAmount,
//   prevTime,
//   isDelete = false,
// }: Params) {
//   let amount = transactionType === TRANSACTION_TYPES.income ? refAmount : refAmount * -1;
//   const date = new Date(time);
//   date.setHours(0, 0, 0, 0);

//   if (isDelete) {
//     amount = -amount;
//   } else if (prevData) {
//     const originalDate = new Date(prevData.time);
//     const originalAmount =
//       prevData.transactionType === TRANSACTION_TYPES.income
//         ? prevData.refAmount
//         : prevData.refAmount * -1;
//     originalDate.setHours(0, 0, 0, 0);

//     if (
//       accountId !== prevData.accountId ||
//       +date !== +originalDate ||
//       data.transactionType !== prevData.transactionType ||
//       amount
//     ) {
//       await BalancesModel.default.updateRecord({
//         accountId: prevData.accountId,
//         date: originalDate,
//         amount: -originalAmount,
//       });
//     }
//   }

//   await BalancesModel.default.updateRecord({
//     accountId,
//     date,
//     amount,
//   });
//   // } else if (data.accountType === ACCOUNT_TYPES.monobank) {
//   //   const balance = (data.externalData as TransactionsAttributes['externalData']).balance;

//   //   const existingRecordForTheDate = await Balances.findOne({
//   //     where: {
//   //       accountId,
//   //       date,
//   //     },
//   //   });

//   //   if (existingRecordForTheDate) {
//   //     existingRecordForTheDate.amount =
//   //       existingRecordForTheDate.amount > (balance || 0)
//   //         ? existingRecordForTheDate.amount
//   //         : (balance as number);

//   //     await existingRecordForTheDate.save();
//   //   } else {
//   //     await Balances.create({
//   //       accountId,
//   //       date,
//   //       amount: (data.externalData as TransactionsAttributes['externalData']).balance,
//   //     });
//   //   }
//   // }
// }

// interface Params {
//   accountId: number;
//   accountType: ACCOUNT_TYPES;
//   transactionType: TRANSACTION_TYPES;
//   refAmount: number;
//   time: Date;
//   externalData?: TransactionsAttributes['externalData'];
//   prevAccountId?: number;
//   prevTransactionType?: TRANSACTION_TYPES;
//   prevRefAmount?: number;
//   prevTime?: Date;
//   isDelete?: boolean;
// }
