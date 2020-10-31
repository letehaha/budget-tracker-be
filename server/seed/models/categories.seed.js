const mongoose = require('mongoose');
const Category = require('@models/Category');

const foodId = new mongoose.Types.ObjectId();
const shoppingId = new mongoose.Types.ObjectId();
const housingId = new mongoose.Types.ObjectId();
const transportationId = new mongoose.Types.ObjectId();
const venicheId = new mongoose.Types.ObjectId();
const lifeId = new mongoose.Types.ObjectId();
const communicationId = new mongoose.Types.ObjectId();
const financialId = new mongoose.Types.ObjectId();
const investmentsId = new mongoose.Types.ObjectId();
const incomeId = new mongoose.Types.ObjectId();

module.exports = [
  new Category({
    _id: foodId,
    name: 'Food & Drinks',
  }),
  ...[
    new Category({
      name: 'Groceries',
      parentId: foodId,
    }),
    new Category({
      name: 'Restaurant',
      parentId: foodId,
    }),
    new Category({
      name: 'Fast-food',
      parentId: foodId,
    }),
    new Category({
      name: 'Bar',
      parentId: foodId,
    }),
    new Category({
      name: 'Cafe',
      parentId: foodId,
    }),
  ],
  new Category({
    name: 'Shopping',
    _id: shoppingId,
  }),
  ...[
    new Category({
      name: 'Clothes & shoes',
      parentId: shoppingId,
    }),
    new Category({
      name: 'Health and beauty',
      parentId: shoppingId,
    }),
    new Category({
      name: 'Home, garden',
      parentId: shoppingId,
    }),
    new Category({
      name: 'Pets, animals',
      parentId: shoppingId,
    }),
    new Category({
      name: 'Electronics, accessories',
      parentId: shoppingId,
    }),
    new Category({
      name: 'Gofts, joy',
      parentId: shoppingId,
    }),
    new Category({
      name: 'Free time',
      parentId: shoppingId,
    }),
    new Category({
      name: 'Drug-stire, chemist',
      parentId: shoppingId,
    }),
  ],
  new Category({
    _id: housingId,
    name: 'Housing',
  }),
  ...[
    new Category({
      name: 'Rent',
      parentId: housingId,
    }),
    new Category({
      name: 'Mortgage',
      parentId: housingId,
    }),
    new Category({
      name: 'Energy, utilites',
      parentId: housingId,
    }),
    new Category({
      name: 'Services',
      parentId: housingId,
    }),
    new Category({
      name: 'Maintance, repairs',
      parentId: housingId,
    }),
    new Category({
      name: 'Properly insurance',
      parentId: housingId,
    }),
  ],
  new Category({
    _id: transportationId,
    name: 'Transportation',
  }),
  ...[
    new Category({
      name: 'Public transport',
      parendId: transportationId,
    }),
    new Category({
      name: 'Taxi',
      parendId: transportationId,
    }),
    new Category({
      name: 'Long distance',
      parendId: transportationId,
    }),
    new Category({
      name: 'Business trips',
      parendId: transportationId,
    }),
  ],
  new Category({
    _id: venicheId,
    name: 'Veniche',
  }),
  ...[
    new Category({
      name: 'Fuel',
      parendId: venicheId,
    }),
    new Category({
      name: 'Parking',
      parendId: venicheId,
    }),
    new Category({
      name: 'Vehicle maintenance',
      parendId: venicheId,
    }),
    new Category({
      name: 'Rentals',
      parendId: venicheId,
    }),
    new Category({
      name: 'Venicle insurance',
      parendId: venicheId,
    }),
    new Category({
      name: 'Leasing',
      parendId: venicheId,
    }),
  ],
  new Category({
    _id: lifeId,
    name: 'Life & Entertainment',
  }),
  ...[
    new Category({
      name: 'Health care, doctor',
      parentId: lifeId,
    }),
    new Category({
      name: 'Wellness, beauty',
      parentId: lifeId,
    }),
    new Category({
      name: 'Sport, fitness',
      parentId: lifeId,
    }),
    new Category({
      name: 'Culture, sport events',
      parentId: lifeId,
    }),
    new Category({
      name: 'Life events',
      parentId: lifeId,
    }),
    new Category({
      name: 'Hobbies',
      parentId: lifeId,
    }),
    new Category({
      name: 'Education, development',
      parentId: lifeId,
    }),
    new Category({
      name: 'Books, audio, subscriptions',
      parentId: lifeId,
    }),
    new Category({
      name: 'TV, Streaming',
      parentId: lifeId,
    }),
    new Category({
      name: 'Holiday, trips, hotels',
      parentId: lifeId,
    }),
    new Category({
      name: 'Alcohol, tobacco',
      parentId: lifeId,
    }),
    new Category({
      name: 'Lottery, gambling',
      parentId: lifeId,
    }),
  ],
  new Category({
    _id: communicationId,
    name: 'Communication, PC',
  }),
  ...[
    new Category({
      name: 'Phone, cell phone',
      parentId: communicationId,
    }),
    new Category({
      name: 'Internet',
      parentId: communicationId,
    }),
    new Category({
      name: 'Software, apps, games',
      parentId: communicationId,
    }),
    new Category({
      name: 'Postal services',
      parentId: communicationId,
    }),
  ],
  new Category({
    _id: financialId,
    name: 'Financial expenses',
  }),
  ...[
    new Category({
      name: 'Taxes',
      parentId: financialId,
    }),
    new Category({
      name: 'Insurances',
      parentId: financialId,
    }),
    new Category({
      name: 'Loan, interests',
      parentId: financialId,
    }),
    new Category({
      name: 'Fines',
      parentId: financialId,
    }),
    new Category({
      name: 'Advisory',
      parentId: financialId,
    }),
    new Category({
      name: 'Charges, fees',
      parentId: financialId,
    }),
    new Category({
      name: 'Child Support',
      parentId: financialId,
    }),
  ],
  new Category({
    _id: investmentsId,
    name: 'Investments',
  }),
  ...[
    new Category({
      name: 'Realty',
      parentId: investmentsId,
    }),
    new Category({
      name: 'Venicles, chattels',
      parentId: investmentsId,
    }),
    new Category({
      name: 'Financial investments',
      parentId: investmentsId,
    }),
    new Category({
      name: 'Savings',
      parentId: investmentsId,
    }),
    new Category({
      name: 'Collections',
      parentId: investmentsId,
    }),
  ],
  new Category({
    _id: incomeId,
    name: 'Income',
  }),
  ...[
    new Category({
      name: 'Wage, invoices',
      parentId: incomeId,
    }),
    new Category({
      name: 'Interests, dividends',
      parentId: incomeId,
    }),
    new Category({
      name: 'Sale',
      parentId: incomeId,
    }),
    new Category({
      name: 'Rental income',
      parentId: incomeId,
    }),
    new Category({
      name: 'Dues & grants',
      parentId: incomeId,
    }),
    new Category({
      name: 'Lending, renting',
      parentId: incomeId,
    }),
    new Category({
      name: 'Checks, coupons',
      parentId: incomeId,
    }),
    new Category({
      name: 'Lottery, gambling',
      parentId: incomeId,
    }),
    new Category({
      name: 'Refunds (tax, purchase)',
      parentId: incomeId,
    }),
    new Category({
      name: 'Freelance',
      parentId: incomeId,
    }),
    new Category({
      name: 'Gifts',
      parentId: incomeId,
    }),
  ],
];
