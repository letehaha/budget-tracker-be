const mongoose = require('mongoose');
const Account = require('@models/Account');
const Currency = require('@models/Currency');
const AccountType = require('@models/AccountType');

exports.getAccounts = async (req, res, next) => {
  try {
    const data = await Account.find();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.createAccount = async (req, res, next) => {
  const {
    name,
    type,
    currency,
    currentBalance,
  } = req.body;

  try {
    const typeRecord = await AccountType.findById(type);
    if (!typeRecord) {
      return res.status(404).json({
        message: `No "account type" found with such id ${type}`,
        statusCode: 404,
      });
    }

    const currencyRecord = await Currency.findById(currency);
    if (!currencyRecord) {
      return res.status(404).json({
        message: `No "currency" found with such id ${currency}`,
        statusCode: 404,
      });
    }

    const data = await new Account({
      name,
      type: typeRecord._id,
      currency: currencyRecord._id,
      currentBalance,
    }).save();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.updateAccount = async (req, res, next) => {
  const { id } = req.params;
  const {
    name,
    type,
    currency,
    currentBalance,
  } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Account id is invalid',
      });
    }

    const accountRecord = await Account.findById(id);
    if (!accountRecord) {
      return res.status(404).json({
        message: `No "account" found with such id "${id}"`,
      });
    }

    let typeRecord;
    if (type) {
      typeRecord = await AccountType.findById(type);
      if (!typeRecord) {
        return res.status(404).json({
          message: `No "account type" found with such id ${type}`,
        });
      }
    }

    let currencyRecord;
    if (currency) {
      currencyRecord = await Currency.findById(currency);
      if (!currencyRecord) {
        return res.status(404).json({
          message: `No "currency" found with such id ${currency}`,
        });
      }
    }

    const query = { _id: accountRecord._id };
    const update = {
      ...!!name && { name },
      ...!!type && { type: typeRecord._id },
      ...!!currency && { currency: currencyRecord._id },
      ...!!currentBalance && { currentBalance },
    };
    await Account.updateOne(query, update);

    const data = await Account.findById(query._id);

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.deleteAccount = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Account id is invalid',
      });
    }

    const accountRecord = await Account.findById(id);
    if (!accountRecord) {
      return res.status(404).json({
        message: `No "account" found with such id "${id}"`,
      });
    }

    await Account.findByIdAndDelete(id);

    return res.status(200).json({ response: {} });
  } catch (err) {
    return next(new Error(err));
  }
};
