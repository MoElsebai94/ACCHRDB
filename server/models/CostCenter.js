const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const CostCenter = sequelize.define('CostCenter', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

module.exports = CostCenter;
