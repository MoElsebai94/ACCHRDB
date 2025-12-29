const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Department = sequelize.define('Department', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

module.exports = Department;
