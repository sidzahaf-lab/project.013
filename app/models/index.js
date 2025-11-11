// app/models/index.js
import { Sequelize } from 'sequelize';
import masterPlanDocModel from './masterplandoc.js';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'db',           // database name
  process.env.DB_USER || 'root',         // username
  process.env.DB_PASS || 'root',         // password
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: console.log,
  }
);

const MasterPlanDoc = masterPlanDocModel(sequelize);

export { sequelize, MasterPlanDoc };