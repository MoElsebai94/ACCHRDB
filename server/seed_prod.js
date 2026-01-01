const Sequelize = require('sequelize');
const { DataTypes } = require('sequelize');
const path = require('path');
const os = require('os');

// Target the production database path found in Application Support
// Adjust this path based on your findings (e.g., 'HR Database' or 'gomaadb')
// Using 'HR Database' based on productName, but checked 'gomaadb' existence.
// Try to target the one that exists.
const PROD_DB_PATH = path.join(os.homedir(), 'Library/Application Support/gomaadb/gomaadb.sqlite');

console.log('Targeting DB Path:', PROD_DB_PATH);

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: PROD_DB_PATH,
    logging: false
});

// Minimal Employee Model Definition for Seeding
const Employee = sequelize.define('Employee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    position: { type: DataTypes.STRING, allowNull: false },
    department: { type: DataTypes.STRING, allowNull: false },
    costCenter: { type: DataTypes.STRING, allowNull: true },
    salary: { type: DataTypes.FLOAT, allowNull: false },
    dateHired: { type: DataTypes.DATEONLY, allowNull: false },
    fixedNumber: { type: DataTypes.STRING, allowNull: false },
    jobRole: { type: DataTypes.STRING, allowNull: false },
    contractStartDate: { type: DataTypes.DATEONLY, allowNull: false },
    contractEndDate: { type: DataTypes.DATEONLY, allowNull: false },
    arrivalDate: { type: DataTypes.DATEONLY, allowNull: false },
    vacationReturnDate: { type: DataTypes.DATEONLY, allowNull: true },
    loanStartDate: { type: DataTypes.DATEONLY, allowNull: true },
    loanEndDate: { type: DataTypes.DATEONLY, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const DEPARTMENTS = ['HR', 'Finance', 'Engineering', 'Operations', 'IT', 'Logistics'];
const POSITIONS = ['Manager', 'Engineer', 'Accountant', 'Driver', 'Worker', 'Clerk'];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        const employees = [];
        for (let i = 1; i <= 70; i++) {
            const randomDept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
            const randomPos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];

            employees.push({
                firstName: `TEST_USER_${i}`,
                lastName: `TestLastName_${i}`,
                fixedNumber: `9000${i}`,
                email: `testuser${i}@example.com`,
                position: randomPos,
                department: randomDept,
                costCenter: 'CC-001',
                salary: Math.floor(Math.random() * 5000) + 2000,
                dateHired: '2023-01-01',
                contractStartDate: '2023-01-01',
                contractEndDate: '2026-01-01',
                arrivalDate: '2023-01-05',
                jobRole: 'Full Time',
                isActive: true,
                vacationReturnDate: i % 10 === 0 ? '2025-02-01' : null,
                loanStartDate: i % 15 === 0 ? '2024-01-01' : null,
                loanEndDate: i % 15 === 0 ? '2024-06-01' : null
            });
        }

        await Employee.bulkCreate(employees);
        console.log('Successfully seeded 70 test employees into PRODUCTION DB.');

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await sequelize.close();
    }
}

seed();
