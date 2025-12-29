const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const LoanHistory = sequelize.define('LoanHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    notes: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = LoanHistory;
