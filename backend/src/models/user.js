import { Model, DataTypes } from 'sequelize';

export default (sequelize, DataTypesArg = DataTypes) => {
  class User extends Model {}
  User.init({
    id: {
      type: DataTypesArg.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypesArg.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypesArg.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypesArg.STRING,
      allowNull: false,
    },
    avatar_url: {
      type: DataTypesArg.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
  });
  return User;
};
