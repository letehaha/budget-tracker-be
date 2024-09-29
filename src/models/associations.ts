import { Sequelize } from 'sequelize-typescript';

// To avoid issues with circular dependencies, we assign associations here
export function initAssociations(sequelize: Sequelize) {
  const Users = sequelize.model('Users');
  const Accounts = sequelize.model('Accounts');

  Users.hasMany(Accounts, { foreignKey: 'userId' });
  Accounts.belongsTo(Users, { foreignKey: 'userId' });
}
