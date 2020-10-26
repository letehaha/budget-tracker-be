module.exports = {
  env: {
    browser: false,
    commonjs: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-underscore-dangle': ['warn', {
      allow: ['_id'],
    }],
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@models', './server/models'],
          ['@controllers', './server/controllers'],
          ['@middlewares', './server/middlewares'],
          ['@routes', './server/routes'],
        ],
        extensions: ['.ts', '.js', '.json'],
      },
    },
  },
};
