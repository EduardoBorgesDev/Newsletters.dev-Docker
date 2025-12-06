import Sequelize from 'sequelize';
import configFile from '../config/config.js';

const env = process.env.NODE_ENV;
const config = configFile[env];
const bd = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

async function loadFactory(modulePath) {
  const mod = await import(modulePath);
  return mod.default || mod;
}

const userFactory = await loadFactory('./user.js');
const taskFactory = await loadFactory('./task.js');
const newsletterFactory = await loadFactory('./newsletter.js');

bd.User = userFactory(sequelize, Sequelize.DataTypes);
bd.Task = taskFactory(sequelize, Sequelize.DataTypes);
bd.Newsletter = newsletterFactory(sequelize, Sequelize.DataTypes);

bd.sequelize = sequelize;
bd.Sequelize = Sequelize;

export default bd;
//att