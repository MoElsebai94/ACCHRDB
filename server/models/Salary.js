const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Salary = sequelize.define('Salary', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    month: {
        type: DataTypes.STRING, // YYYY-MM
        allowNull: false
    },
    attendedDays: {
        type: DataTypes.INTEGER,
        defaultValue: 30
    },
    deductions: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    baseSalary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    netSalary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    notes: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Salary;
