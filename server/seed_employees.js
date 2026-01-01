const sequelize = require('./database');
const Employee = require('./models/Employee');

// Ensure models and associations are loaded if needed, though requiring Employee usually suffices for simple inserts
// If there were relations, we might need to load them, but for Employee keys we just need strings mostly.

const DEPARTMENTS = ['HR', 'Finance', 'Engineering', 'Operations', 'IT', 'Logistics'];
const POSITIONS = ['Manager', 'Engineer', 'Accountant', 'Driver', 'Worker', 'Clerk'];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync models just in case (though app should have done it)
        // await sequelize.sync(); 

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
                // Add some vacation data for a few to test reports
                vacationReturnDate: i % 10 === 0 ? '2025-02-01' : null,
                // Add some loan data for loop testing 
                loanStartDate: i % 15 === 0 ? '2024-01-01' : null,
                loanEndDate: i % 15 === 0 ? '2024-06-01' : null
            });
        }

        await Employee.bulkCreate(employees);
        console.log('Successfully seeded 70 test employees.');

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await sequelize.close();
    }
}

seed();
