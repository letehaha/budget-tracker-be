import config from 'config';
import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ERROR_CODES } from 'shared-types';
import { RESPONSE_STATUS } from '@common/types';
import Users from '../models/Users.model';

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.get('jwtSecret'),
};

export default (passport) => {
  passport.use(
    new Strategy(options, async (payload, done) => {
      try {
        const user = await Users.findOne({
          where: { id: payload.userId },
          attributes: ['username', 'id'],
        });

        if (user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          done(null, (user as any).dataValues);
        } else {
          done(null, false);
        }
      } catch (e) {
        done(e);
      }
    }),
  );
}

export const authenticateJwt = (req, res, next) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err, user) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({
          status: RESPONSE_STATUS.error,
          response: {
            message: 'Unauthorized',
            code: ERROR_CODES.unauthorized,
          },
        });
      }
      req.user = user;
      next();
    },
  )(req, res, next);
}
