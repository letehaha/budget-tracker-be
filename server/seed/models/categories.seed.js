const Category = require('@models/Category');

module.exports = [
  new Category({
    name: 'Food & Drinks',
    subcategories: [
      new Category({
        name: 'Groceries',
      }),
      new Category({
        name: 'Restaurant',
      }),
      new Category({
        name: 'Fast-food',
      }),
      new Category({
        name: 'Bar',
      }),
      new Category({
        name: 'Cafe',
      }),
    ],
  }),
  new Category({
    name: 'Shopping',
    subcategories: [
      new Category({
        name: 'Clothes & shoes',
      }),
      new Category({
        name: 'Health and beauty',
      }),
      new Category({
        name: 'Home, garden',
      }),
      new Category({
        name: 'Pets, animals',
      }),
      new Category({
        name: 'Electronics, accessories',
      }),
      new Category({
        name: 'Gofts, joy',
      }),
      new Category({
        name: 'Free time',
      }),
      new Category({
        name: 'Drug-stire, chemist',
      }),
    ],
  }),
  new Category({
    name: 'Housing',
    subcategories: [
      new Category({
        name: 'Rent',
      }),
      new Category({
        name: 'Mortgage',
      }),
      new Category({
        name: 'Energy, utilites',
      }),
      new Category({
        name: 'Services',
      }),
      new Category({
        name: 'Maintance, repairs',
      }),
      new Category({
        name: 'Properly insurance',
      }),
    ],
  }),
  new Category({
    name: 'Transportation',
    subcategories: [
      new Category({
        name: 'Public transport',
      }),
      new Category({
        name: 'Taxi',
      }),
      new Category({
        name: 'Long distance',
      }),
      new Category({
        name: 'Business trips',
      }),
    ],
  }),
  new Category({
    name: 'Veniche',
    subcategories: [
      new Category({
        name: 'Fuel',
      }),
      new Category({
        name: 'Parking',
      }),
      new Category({
        name: 'Vehicle maintenance',
      }),
      new Category({
        name: 'Rentals',
      }),
      new Category({
        name: 'Venicle insurance',
      }),
      new Category({
        name: 'Leasing',
      }),
    ],
  }),
  new Category({
    name: 'Life & Entertainment',
    subcategories: [
      new Category({
        name: 'Health care, doctor',
      }),
      new Category({
        name: 'Wellness, beauty',
      }),
      new Category({
        name: 'Sport, fitness',
      }),
      new Category({
        name: 'Culture, sport events',
      }),
      new Category({
        name: 'Life events',
      }),
      new Category({
        name: 'Hobbies',
      }),
      new Category({
        name: 'Education, development',
      }),
      new Category({
        name: 'Books, audio, subscriptions',
      }),
      new Category({
        name: 'TV, Streaming',
      }),
      new Category({
        name: 'Holiday, trips, hotels',
      }),
      new Category({
        name: 'Alcohol, tobacco',
      }),
      new Category({
        name: 'Lottery, gambling',
      }),
    ],
  }),
  new Category({
    name: 'Communication, PC',
    subcategories: [
      new Category({
        name: 'Phone, cell phone',
      }),
      new Category({
        name: 'Internet',
      }),
      new Category({
        name: 'Software, apps, games',
      }),
      new Category({
        name: 'Postal services',
      }),
    ],
  }),
  new Category({
    name: 'Financial expenses',
    subcategories: [
      new Category({
        name: 'Taxes',
      }),
      new Category({
        name: 'Insurances',
      }),
      new Category({
        name: 'Loan, interests',
      }),
      new Category({
        name: 'Fines',
      }),
      new Category({
        name: 'Advisory',
      }),
      new Category({
        name: 'Charges, fees',
      }),
      new Category({
        name: 'Child Support',
      }),
    ],
  }),
  new Category({
    name: 'Investments',
    subcategories: [
      new Category({
        name: 'Realty',
      }),
      new Category({
        name: 'Venicles, chattels',
      }),
      new Category({
        name: 'Financial investments',
      }),
      new Category({
        name: 'Savings',
      }),
      new Category({
        name: 'Collections',
      }),
    ],
  }),
  new Category({
    name: 'Income',
    subcategories: [
      new Category({
        name: 'Wage, invoices',
      }),
      new Category({
        name: 'Interests, dividends',
      }),
      new Category({
        name: 'Sale',
      }),
      new Category({
        name: 'Rental income',
      }),
      new Category({
        name: 'Dues & grants',
      }),
      new Category({
        name: 'Lending, renting',
      }),
      new Category({
        name: 'Checks, coupons',
      }),
      new Category({
        name: 'Lottery, gambling',
      }),
      new Category({
        name: 'Refunds (tax, purchase)',
      }),
      new Category({
        name: 'Freelance',
      }),
      new Category({
        name: 'Gifts',
      }),
    ],
  }),
];
