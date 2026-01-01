const Sequelize = require('sequelize');
const { DataTypes } = require('sequelize');
const { Op } = require('sequelize');
const path = require('path');
const os = require('os');

const PROD_DB_PATH = path.join(os.homedir(), 'Library/Application Support/gomaadb/gomaadb.sqlite');

console.log('Targeting Cleanup DB Path:', PROD_DB_PATH);

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: PROD_DB_PATH,
    logging: false
});

const Employee = sequelize.define('Employee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    firstName: { type: DataTypes.STRING, allowNull: false }
});

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

        console.log(`Successfully deleted ${result} test employees from PRODUCTION DB.`);

    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        await sequelize.close();
    }
}

cleanup();
