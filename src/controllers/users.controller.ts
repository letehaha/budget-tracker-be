import { getUsers as getUsersModel } from '../models/Users.model';

export const getUsers = async (req, res, next) => {
  try {
    const users = await getUsersModel();

    return res.status(200).json({ response: users });
  } catch (err) {
    return next(new Error(err));
  }
};
