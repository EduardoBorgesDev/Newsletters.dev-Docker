import { Model, DataTypes } from 'sequelize';

export default (sequelize, DataTypesArg = DataTypes) => {
  class Newsletter extends Model {}
  Newsletter.init({
    id: {
      type: DataTypesArg.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypesArg.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypesArg.TEXT,
      allowNull: false,
    },
    image_url: {
      type: DataTypesArg.STRING,
      allowNull: true,
    },
    author_id: {
      type: DataTypesArg.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Newsletter',
    tableName: 'Newsletters',
  });
  return Newsletter;
};
//att