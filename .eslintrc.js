const isWindows = process.platform === 'win32' || process.platform === 'win64';

module.exports = {
  env: {
    browser: false,
    commonjs: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  globals: {
    Promise: true,
    Map: true,
    Set: true,
  },
  rules: {
    'no-underscore-dangle': ['warn', {
      allow: ['_id'],
    }],
    'linebreak-style': ['error', (isWindows ? 'windows' : 'unix')],
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@models', './server/models'],
          ['@controllers', './server/controllers'],
          ['@middlewares', './server/middlewares'],
          ['@routes', './server/routes'],
          ['@js', './server/js'],
          ['@resources', './server/resources'],
        ],
        extensions: ['.ts', '.js', '.json'],
      },
    },
  },
};
