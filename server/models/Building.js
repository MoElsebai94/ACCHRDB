const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Building = sequelize.define('Building', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = Building;
