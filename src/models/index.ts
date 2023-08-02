import { Sequelize } from 'sequelize-typescript';
import config from 'config';

const connection: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sequelize?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Sequelize?: any,
} = {};

const DBConfig: Record<string, unknown> = config.get('db');

// console.log('JEST global', global.process.env.JEST_WORKER_ID);
const sequelize = new Sequelize({
  ...DBConfig,
  models: [__dirname + '/**/*.model.ts'],
});

if (['development', 'test'].includes(process.env.NODE_ENV)) {
  console.log('DBConfig', DBConfig);
}

connection.sequelize = sequelize;
connection.Sequelize = Sequelize;

export { connection }
