const User = require('@models/User');

async function seedTestUsers() {
  const user = new User({
    username: 'letehaha',
    email: '',
    password: 'password',
  });

  await user.save();
}

module.exports = {
  seedTestUsers,
};
