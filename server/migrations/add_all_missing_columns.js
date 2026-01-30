/**
 * Migration: Add ALL missing columns to Employees table
 * This ensures the database schema matches the Employee model
 */

const sequelize = require('../database');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Get existing columns
        const [columns] = await sequelize.query(`PRAGMA table_info(Employees);`);
        const existingColumns = columns.map(c => c.name);
        console.log('Existing columns:', existingColumns.join(', '));

        // All string/date columns from Employee model
        const stringColumns = [
            'fullName',
            'email',
            'position',
            'department',
            'costCenter',
            'dateHired',
            'fixedNumber',
            'jobRole',
            'contractStartDate',
            'contractEndDate',
            'arrivalDate',
            'vacationReturnDate',
            'vacationStartDate',
            'qualification',
            'qualificationDate',
            'maritalStatus',
            'grade',
            'gradeDate',
            'currentJobTitleDate',
            'loanStartDate',
            'loanEndDate',
            'departmentBeforeLoan',
            'currentWorkLocation',
            'cairoPhone',
            'cameroonPhone',
            'address',
            'efficiencyReport',
            'photoUrl',
            'airline',
            'arrivalDateBeforeVacation',
            'travelDate',
            'birthDate'
        ];

        // Numeric columns (REAL type)
        const numericColumns = [
            'salary',
            'allowances'
        ];

        // Boolean columns
        const booleanColumns = [
            'isActive'
        ];

        let addedCount = 0;

        // Add missing string columns
        for (const colName of stringColumns) {
            if (!existingColumns.includes(colName)) {
                console.log(`Adding column: ${colName} (VARCHAR)...`);
                await sequelize.query(`ALTER TABLE Employees ADD COLUMN ${colName} VARCHAR(255);`);
                addedCount++;
            }
        }

        // Add missing numeric columns
        for (const colName of numericColumns) {
            if (!existingColumns.includes(colName)) {
                console.log(`Adding column: ${colName} (REAL)...`);
                await sequelize.query(`ALTER TABLE Employees ADD COLUMN ${colName} REAL;`);
                addedCount++;
            }
        }

        // Add missing boolean columns
        for (const colName of booleanColumns) {
            if (!existingColumns.includes(colName)) {
                console.log(`Adding column: ${colName} (BOOLEAN)...`);
                await sequelize.query(`ALTER TABLE Employees ADD COLUMN ${colName} BOOLEAN DEFAULT 1;`);
                addedCount++;
            }
        }

        if (addedCount > 0) {
            console.log(`\nMigration completed! Added ${addedCount} columns.`);
        } else {
            console.log('\nNo missing columns. Database schema is up to date.');
        }

        // Verify final columns
        const [finalColumns] = await sequelize.query(`PRAGMA table_info(Employees);`);
        console.log('\nFinal column count:', finalColumns.length);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}

migrate();
