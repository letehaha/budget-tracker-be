import config from 'config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RESPONSE_STATUS, ERROR_CODES } from 'shared-types';

import { connection } from '@models/index';
import * as userService from '@services/user.service';
import * as categoriesService from '@services/categories.service';
import { DEFAULT_CATEGORIES } from '@js/const';
import { logger} from '@js/utils/logger';
import { Unauthorized, NotFoundError, UnexpectedError, ConflictError } from '@js/errors';

export const login = async (
  {
    username,
    password,
  }: {
    username: string;
    password: string;
  }
): Promise<{ token: string }> => {
  try {
    const user = await userService.getUserByCredentials({ username });

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

        return { token: `Bearer ${token}` };
      }

      throw new Unauthorized(
        ERROR_CODES.invalidCredentials,
        'User email and/or password are invalid!'
      )
    }

    throw new NotFoundError(
      ERROR_CODES.notFound,
      'User not found!'
    )
  } catch (err) {
    logger.error(err)
    throw err
  }
};

export const register = async (
  {
    username,
    password,
  }: {
    username: string;
    password: string;
  }
) => {
  let registrationTransaction = null;

  try {
    // Define registration transaction
    registrationTransaction = await connection.sequelize.transaction({
      isolationLevel:
        connection.Sequelize.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
    });

    // Check if user already exists
    let user = await userService.getUserByCredentials({ username });
    if (user) {
      throw new ConflictError(
        RESPONSE_STATUS.error,
        'User already exists!',
      );
    }

    const salt = bcrypt.genSaltSync(10);

    // Create user with salted password
    user = await userService.createUser(
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

    // Insert default categories
    categories = await categoriesService.bulkCreate(
      { data: categories },
      { transaction: registrationTransaction, returning: true },
    )

    let subcats = [];

    // Loop through categories and make subcats as a raw array of categories
    // since DB expects that
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

    await categoriesService.bulkCreate(
      { data: subcats },
      { transaction: registrationTransaction },
    )

    // set defaultCategoryId so the undefined mcc codes will use it
    const defaultCategoryId = (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categories.find((item: any) => item.get('name') === DEFAULT_CATEGORIES.names.other) as any
    ).get('id');

    if (!defaultCategoryId) {
      // TODO: return UnexpectedError, but move descriptive message to logger, so users won't see this internal issue
      throw new UnexpectedError(
        ERROR_CODES.unexpected,
        "Cannot find 'defaultCategoryId' in the previously create categories.",
      )
    } else {
      user = await userService.updateUser(
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

    return user;
  } catch (err) {
    if (registrationTransaction) {
      await registrationTransaction.rollback();
    }

    logger.error(err)
    throw err
  }
};
