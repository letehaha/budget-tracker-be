export enum ACCOUNT_TYPES {
  system = 'system',
  monobank = 'monobank',
}

export enum PAYMENT_TYPES {
  bankTransfer = 'bankTransfer',
  voucher = 'voucher',
  webPayment = 'webPayment',
  cash = 'cash',
  mobilePayment = 'mobilePayment',
  creditCard = 'creditCard',
  debitCard = 'debitCard',
}

export enum TRANSACTION_TYPES {
  income = 'income',
  expense = 'expense',
}

export enum CATEGORY_TYPES {
  custom = 'custom',
  // internal means that it cannot be deleted or edited
  internal = 'internal',
}

// Stored like that in the DB as well
export enum TRANSACTION_TRANSFER_NATURE {
  not_transfer = 'not_transfer',
  transfer_between_user_accounts = 'transfer_between_user_accounts',
  transfer_out_wallet = 'transfer_out_wallet',
}

export * from './api';
export * from './models';
export * as endpointsTypes from './routes';
