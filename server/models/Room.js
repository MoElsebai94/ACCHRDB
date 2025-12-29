const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Room = sequelize.define('Room', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    apartmentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    permanentResidentId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    temporaryResidentId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = Room;
