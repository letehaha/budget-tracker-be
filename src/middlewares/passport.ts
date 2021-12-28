import config from 'config';
import { Strategy, ExtractJwt } from 'passport-jwt';
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