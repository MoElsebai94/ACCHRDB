const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Department = sequelize.define('Department', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Departments',
            key: 'id'
        }
    }
});

module.exports = Department;
