const sequelize = require('./database');
const Employee = require('./models/Employee');
const { Op } = require('sequelize');

async function cleanup() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const result = await Employee.destroy({
            where: {
                firstName: {
                    [Op.like]: 'TEST_USER_%'
                }
            }
        });

        console.log(`Successfully deleted ${result} test employees.`);

    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        await sequelize.close();
    }
}

cleanup();
