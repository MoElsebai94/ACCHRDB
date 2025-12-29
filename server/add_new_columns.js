const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const columns = [
    "ADD COLUMN qualification VARCHAR(255)",
    "ADD COLUMN qualificationDate DATE",
    "ADD COLUMN maritalStatus VARCHAR(255)",
    "ADD COLUMN grade VARCHAR(255)",
    "ADD COLUMN gradeDate DATE",
    "ADD COLUMN currentJobTitleDate DATE",
    "ADD COLUMN loanStartDate DATE",
    "ADD COLUMN loanEndDate DATE",
    "ADD COLUMN isActive BOOLEAN DEFAULT 1"
];

db.serialize(() => {
    columns.forEach(col => {
        const sql = `ALTER TABLE Employees ${col}`;
        db.run(sql, function (err) {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log(`Column already exists: ${col}`);
                } else {
                    console.error(`Error adding column (${col}):`, err.message);
                }
            } else {
                console.log(`Success: ${col}`);
            }
        });
    });
});

db.close();
