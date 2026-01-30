/**
 * Migration: Add allowances column to Employees table
 * Run this script to add the allowances field to an existing database
 */

const sequelize = require('../database');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Check if allowances column already exists
        const [columns] = await sequelize.query(`PRAGMA table_info(Employees);`);
        const columnNames = columns.map(c => c.name);

        if (columnNames.includes('allowances')) {
            console.log('Column "allowances" already exists. No migration needed.');
            return;
        }

        console.log('Adding "allowances" column to Employees table...');

        // Add the allowances column
        await sequelize.query(`
            ALTER TABLE Employees ADD COLUMN allowances REAL;
        `);

        console.log('Migration completed successfully! "allowances" column added.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}

migrate();
