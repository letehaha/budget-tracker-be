import { Sequelize } from 'sequelize-typescript';
import config from 'config';
import cls from 'cls-hooked';

export const namespace = cls.createNamespace('budget-tracker-namespace');
Sequelize.useCLS(namespace);

const connection: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sequelize?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Sequelize?: any;
} = {};

const DBConfig: Record<string, unknown> = config.get('db');

const sequelize = new Sequelize({
  ...DBConfig,
  models: [__dirname + '/**/*.model.ts'],
  pool: {
    max: 50,
    evict: 10000,
  },
});

if (['development'].includes(process.env.NODE_ENV)) {
  console.log('DBConfig', DBConfig);
}

connection.sequelize = sequelize;
connection.Sequelize = Sequelize;

export { connection };
