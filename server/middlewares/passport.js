const config = require('config');
const { Strategy, ExtractJwt } = require('passport-jwt');
const { Users } = require('@models');

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.get('jwtSecret'),
};

module.exports = (passport) => {
  passport.use(
    new Strategy(options, async (payload, done) => {
      try {
        const user = await Users.findOne({
          where: { id: payload.userId },
          attributes: ['username', 'id'],
        });

        if (user) {
          done(null, user.dataValues);
        } else {
          done(null, false);
        }
      } catch (e) {
        done(e);
      }
    }),
  );
};
