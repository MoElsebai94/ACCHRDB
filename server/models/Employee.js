const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: {
        msg: "البريد الإلكتروني غير صحيح"
      }
    }
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  costCenter: {
    type: DataTypes.STRING,
    allowNull: true
  },
  salary: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  dateHired: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fixedNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  jobRole: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contractStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  contractEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  arrivalDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  vacationReturnDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  vacationStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  qualification: {
    type: DataTypes.STRING,
    allowNull: true
  },
  qualificationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  maritalStatus: {
    type: DataTypes.STRING, // 'Single', 'Married', 'Divorced', 'Widowed'
    allowNull: true
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gradeDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  currentJobTitleDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  loanStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  loanEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  departmentBeforeLoan: {
    type: DataTypes.STRING,
    allowNull: true
  },
  currentWorkLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cairoPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cameroonPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  efficiencyReport: {
    type: DataTypes.STRING,
    allowNull: true
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  airline: {
    type: DataTypes.STRING,
    allowNull: true
  },
  arrivalDateBeforeVacation: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
});

module.exports = Employee;
