import config from 'config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connection } from '../models';
import {
  getUserByCredentials,
  updateUserById,
  createUser,
} from '../models/Users.model';
import Categories from '../models/Categories.model';
import { DEFAULT_CATEGORIES } from '../js/const';

export const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await getUserByCredentials({ username });

    if (user) {
      const isPasswordValid = bcrypt.compareSync(
        password,
        user.get('password'),
      );

      if (isPasswordValid) {
        const token = jwt.sign(
          {
            username: user.get('username'),
            userId: user.get('id'),
          },
          config.get('jwtSecret'),
          {
            expiresIn: 60 * 60, // 1 hour
          },
        );

        return res.status(200).json({ response: { token: `Bearer ${token}` } });
      }

      return res
        .status(401)
        .json({ message: 'User email and/or password are invalid!' });
    }

    return res.status(404).json({ message: 'User not found!' });
  } catch (err) {
    return next(new Error(err));
  }
};

export const register = async (req, res, next) => {
  const { username, password } = req.body;

  let registrationTransaction = null;

  try {
    registrationTransaction = await connection.sequelize.transaction({
      isolationLevel:
        connection.Sequelize.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
    });

    let user = await getUserByCredentials({ username });
    if (user) {
      return res.status(409).json({ message: 'User already exists!' });
    }

    const salt = bcrypt.genSaltSync(10);

    user = await createUser(
      {
        username,
        password: bcrypt.hashSync(password, salt),
      },
      {
        transaction: registrationTransaction,
      },
    );

    // default categories
    let categories = DEFAULT_CATEGORIES.main.map((item) => ({
      ...item,
      userId: user.get('id'),
    }));

    categories = await Categories.bulkCreate(categories, {
      transaction: registrationTransaction,
      validate: true,
      returning: true,
    });

    let subcats = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories.forEach((item: any) => {
      const subcategories = DEFAULT_CATEGORIES.subcategories.find(
        (subcat) => subcat.parentName === item.get('name'),
      );

      if (subcategories) {
        subcats = [
          ...subcats,
          ...subcategories.values.map((subItem) => ({
            ...subItem,
            parentId: item.get('id'),
            color: item.get('color'),
            userId: user.get('id'),
          })),
        ];
      }
    });

    await Categories.bulkCreate(subcats, {
      transaction: registrationTransaction,
      validate: true,
    });

    // set defaultCategoryId so the undefined mcc codes will use it
    const defaultCategoryId = (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categories.find((item: any) => item.get('name') === DEFAULT_CATEGORIES.names.other) as any
    ).get('id');

    if (!defaultCategoryId) {
      throw new Error(
        "Cannot find 'defaultCategoryId' in the previously create categories.",
      );
    } else {
      user = await updateUserById(
        {
          defaultCategoryId,
          id: user.get('id'),
        },
        {
          transaction: registrationTransaction,
        },
      );
    }

    await registrationTransaction.commit();

    return res.status(201).json({ response: { user } });
  } catch (err) {
    if (registrationTransaction) {
      await registrationTransaction.rollback();
    }

    return next(new Error(err));
  }
};