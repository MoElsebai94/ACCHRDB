const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Vacation = sequelize.define('Vacation', {
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
    returnDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING, // 'Regular', 'Deduction', 'Emergency', etc.
        allowNull: true
    },
    travelDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    duration: {
        type: DataTypes.INTEGER, // Number of days
        allowNull: true
    },
    notes: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Vacation;
