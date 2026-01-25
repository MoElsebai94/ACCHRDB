/**
 * Migration: Merge firstName and lastName into fullName
 *
 * This script:
 * 1. Adds a fullName column if it doesn't exist
 * 2. Populates fullName from firstName + lastName for existing records
 * 3. Removes firstName and lastName columns
 *
 * Run with: node server/migrations/merge_names.js
 */

const sequelize = require('../database');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Disable foreign key checks during migration
        await sequelize.query('PRAGMA foreign_keys = OFF;');

        // Check if we need to migrate
        const [columns] = await sequelize.query(`PRAGMA table_info(Employees);`);
        const columnNames = columns.map(c => c.name);

        const hasFirstName = columnNames.includes('firstName');
        const hasLastName = columnNames.includes('lastName');
        const hasFullName = columnNames.includes('fullName');

        if (!hasFirstName && !hasLastName && hasFullName) {
            console.log('Migration already completed. fullName exists, firstName/lastName do not.');
            return;
        }

        if (hasFirstName && hasLastName && !hasFullName) {
            console.log('Starting migration: Adding fullName column...');

            // Add fullName column
            await sequelize.query(`ALTER TABLE Employees ADD COLUMN fullName TEXT;`);
            console.log('Added fullName column.');

            // Populate fullName from firstName + lastName
            await sequelize.query(`
                UPDATE Employees
                SET fullName = TRIM(COALESCE(firstName, '') || ' ' || COALESCE(lastName, ''))
                WHERE fullName IS NULL;
            `);
            console.log('Populated fullName from firstName + lastName.');

            // SQLite doesn't support dropping columns directly in older versions
            // We need to recreate the table without those columns
            console.log('Recreating table without firstName/lastName columns...');

            // Create new table structure
            await sequelize.query(`
                CREATE TABLE Employees_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fullName TEXT NOT NULL,
                    email TEXT UNIQUE,
                    position TEXT NOT NULL,
                    department TEXT NOT NULL,
                    costCenter TEXT,
                    salary REAL NOT NULL,
                    dateHired TEXT NOT NULL,
                    fixedNumber TEXT NOT NULL,
                    jobRole TEXT NOT NULL,
                    contractStartDate TEXT NOT NULL,
                    contractEndDate TEXT NOT NULL,
                    arrivalDate TEXT NOT NULL,
                    vacationReturnDate TEXT,
                    vacationStartDate TEXT,
                    qualification TEXT,
                    qualificationDate TEXT,
                    maritalStatus TEXT,
                    grade TEXT,
                    gradeDate TEXT,
                    currentJobTitleDate TEXT,
                    loanStartDate TEXT,
                    loanEndDate TEXT,
                    isActive INTEGER DEFAULT 1,
                    departmentBeforeLoan TEXT,
                    currentWorkLocation TEXT,
                    cairoPhone TEXT,
                    cameroonPhone TEXT,
                    address TEXT,
                    efficiencyReport TEXT,
                    photoUrl TEXT,
                    airline TEXT,
                    arrivalDateBeforeVacation TEXT,
                    travelDate TEXT,
                    createdAt TEXT,
                    updatedAt TEXT
                );
            `);

            // Copy data
            await sequelize.query(`
                INSERT INTO Employees_new (
                    id, fullName, email, position, department, costCenter, salary, dateHired,
                    fixedNumber, jobRole, contractStartDate, contractEndDate, arrivalDate,
                    vacationReturnDate, vacationStartDate, qualification, qualificationDate,
                    maritalStatus, grade, gradeDate, currentJobTitleDate, loanStartDate,
                    loanEndDate, isActive, departmentBeforeLoan, currentWorkLocation,
                    cairoPhone, cameroonPhone, address, efficiencyReport, photoUrl,
                    airline, arrivalDateBeforeVacation, travelDate, createdAt, updatedAt
                )
                SELECT
                    id, fullName, email, position, department, costCenter, salary, dateHired,
                    fixedNumber, jobRole, contractStartDate, contractEndDate, arrivalDate,
                    vacationReturnDate, vacationStartDate, qualification, qualificationDate,
                    maritalStatus, grade, gradeDate, currentJobTitleDate, loanStartDate,
                    loanEndDate, isActive, departmentBeforeLoan, currentWorkLocation,
                    cairoPhone, cameroonPhone, address, efficiencyReport, photoUrl,
                    airline, arrivalDateBeforeVacation, travelDate, createdAt, updatedAt
                FROM Employees;
            `);

            // Swap tables
            await sequelize.query(`DROP TABLE Employees;`);
            await sequelize.query(`ALTER TABLE Employees_new RENAME TO Employees;`);

            // Re-enable foreign key checks
            await sequelize.query('PRAGMA foreign_keys = ON;');
            console.log('Migration completed successfully!');
        } else if (hasFirstName && hasLastName && hasFullName) {
            console.log('fullName already exists. Populating any empty values and removing old columns...');

            // Ensure fullName is populated
            await sequelize.query(`
                UPDATE Employees
                SET fullName = TRIM(COALESCE(firstName, '') || ' ' || COALESCE(lastName, ''))
                WHERE fullName IS NULL OR fullName = '';
            `);

            // Recreate table without firstName/lastName
            console.log('Recreating table without firstName/lastName columns...');

            await sequelize.query(`
                CREATE TABLE Employees_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fullName TEXT NOT NULL,
                    email TEXT UNIQUE,
                    position TEXT NOT NULL,
                    department TEXT NOT NULL,
                    costCenter TEXT,
                    salary REAL NOT NULL,
                    dateHired TEXT NOT NULL,
                    fixedNumber TEXT NOT NULL,
                    jobRole TEXT NOT NULL,
                    contractStartDate TEXT NOT NULL,
                    contractEndDate TEXT NOT NULL,
                    arrivalDate TEXT NOT NULL,
                    vacationReturnDate TEXT,
                    vacationStartDate TEXT,
                    qualification TEXT,
                    qualificationDate TEXT,
                    maritalStatus TEXT,
                    grade TEXT,
                    gradeDate TEXT,
                    currentJobTitleDate TEXT,
                    loanStartDate TEXT,
                    loanEndDate TEXT,
                    isActive INTEGER DEFAULT 1,
                    departmentBeforeLoan TEXT,
                    currentWorkLocation TEXT,
                    cairoPhone TEXT,
                    cameroonPhone TEXT,
                    address TEXT,
                    efficiencyReport TEXT,
                    photoUrl TEXT,
                    airline TEXT,
                    arrivalDateBeforeVacation TEXT,
                    travelDate TEXT,
                    createdAt TEXT,
                    updatedAt TEXT
                );
            `);

            await sequelize.query(`
                INSERT INTO Employees_new (
                    id, fullName, email, position, department, costCenter, salary, dateHired,
                    fixedNumber, jobRole, contractStartDate, contractEndDate, arrivalDate,
                    vacationReturnDate, vacationStartDate, qualification, qualificationDate,
                    maritalStatus, grade, gradeDate, currentJobTitleDate, loanStartDate,
                    loanEndDate, isActive, departmentBeforeLoan, currentWorkLocation,
                    cairoPhone, cameroonPhone, address, efficiencyReport, photoUrl,
                    airline, arrivalDateBeforeVacation, travelDate, createdAt, updatedAt
                )
                SELECT
                    id, fullName, email, position, department, costCenter, salary, dateHired,
                    fixedNumber, jobRole, contractStartDate, contractEndDate, arrivalDate,
                    vacationReturnDate, vacationStartDate, qualification, qualificationDate,
                    maritalStatus, grade, gradeDate, currentJobTitleDate, loanStartDate,
                    loanEndDate, isActive, departmentBeforeLoan, currentWorkLocation,
                    cairoPhone, cameroonPhone, address, efficiencyReport, photoUrl,
                    airline, arrivalDateBeforeVacation, travelDate, createdAt, updatedAt
                FROM Employees;
            `);

            await sequelize.query(`DROP TABLE Employees;`);
            await sequelize.query(`ALTER TABLE Employees_new RENAME TO Employees;`);

            // Re-enable foreign key checks
            await sequelize.query('PRAGMA foreign_keys = ON;');
            console.log('Migration completed successfully!');
        } else {
            console.log('Unknown state. Manual intervention may be required.');
            console.log('Columns found:', columnNames);
        }

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

migrate();
