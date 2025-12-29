const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Apartment = sequelize.define('Apartment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    buildingId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Apartment;
