const User = require('@models/User');
const Currency = require('@models/Currency');
const categories = require('./models/categories.seed');

async function seedTestUsers() {
  const [curr] = await Currency.find();

  const user = new User({
    username: 'letehaha',
    email: '',
    password: 'password',
    currencies: [curr._id],
  });
  await user.save();

  await User.updateOne(
    { _id: user._id },
    {
      $push: { categories: { $each: categories } },
    },
  );
}

module.exports = {
  seedTestUsers,
};
