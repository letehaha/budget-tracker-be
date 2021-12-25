import { Sequelize } from 'sequelize-typescript';
import config from 'config';

const connection: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sequelize?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Sequelize?: any,
}= {};

const DBConfig: Record<string, unknown> = config.get('db');

const sequelize = new Sequelize({
  ...DBConfig,
  models: [__dirname + '/**/*.model.ts'],
})

// Object.keys(connection).forEach((modelName) => {
//   if (connection[modelName].associate) {
//     connection[modelName].associate(connection);
//   }
// });

connection.sequelize = sequelize;
connection.Sequelize = Sequelize;

export { connection }
