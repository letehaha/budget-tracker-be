const CATEGORY_TYPES = require('./category-types.const');

const CATEGORY_NAMES = Object.freeze({
  food: 'Food & Drinks',
  shopping: 'Shopping',
  housing: 'Housing',
  transportation: 'Transportation',
  veniche: 'Veniche',
  life: 'Life & Entertainment',
  communication: 'Communication, PC',
  financialExpenses: 'Financial expenses',
  investments: 'Investments',
  income: 'Income',
  other: 'Other',
});

module.exports = {
  main: [
    {
      name: CATEGORY_NAMES.food,
      type: CATEGORY_TYPES.custom,
      color: '',
    },
    {
      name: CATEGORY_NAMES.shopping,
      type: CATEGORY_TYPES.custom,
      color: '',
    },
    {
      name: CATEGORY_NAMES.housing,
      type: CATEGORY_TYPES.custom,
      color: '',
    },
    {
      name: CATEGORY_NAMES.transportation,
      type: CATEGORY_TYPES.custom,
      color: '',
    },
    {
      name: CATEGORY_NAMES.veniche,
      type: CATEGORY_TYPES.custom,
      color: '',
    },
    {
      name: CATEGORY_NAMES.life,
      type: CATEGORY_TYPES.custom,
      color: '',
    },
    {
      name: CATEGORY_NAMES.communication,
      type: CATEGORY_TYPES.custom,
      color: '',
    },
    {
      name: CATEGORY_NAMES.financialExpenses,
      type: CATEGORY_TYPES.custom,
      color: '',
    },
    {
      name: CATEGORY_NAMES.investments,
      type: CATEGORY_TYPES.custom,
      color: '',
    },
    {
      name: CATEGORY_NAMES.income,
      type: CATEGORY_TYPES.custom,
      color: '',
    },
    {
      name: CATEGORY_NAMES.other,
      type: CATEGORY_TYPES.internal,
      color: '',
    },
  ],
  subcategories: {
    food: {
      parentName: CATEGORY_NAMES.food,
      values: [
        {
          name: 'Groceries',
          type: CATEGORY_TYPES.custom,
          color: '',
        },
        {
          name: 'Restaurane, fast-food',
          type: CATEGORY_TYPES.custom,
          color: '',
        },
        {
          name: 'Bar, cafe',
          type: CATEGORY_TYPES.custom,
          color: '',
        },
      ],
    },
  },
  names: CATEGORY_NAMES,
};
