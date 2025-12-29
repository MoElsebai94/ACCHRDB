const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite'),
    logging: false
});

module.exports = sequelize;
