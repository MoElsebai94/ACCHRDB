const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const sql = `ALTER TABLE Employees ADD COLUMN costCenter VARCHAR(255)`;

db.run(sql, function (err) {
    if (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('Column already exists');
        } else {
            console.error('Error adding column:', err.message);
        }
    } else {
        console.log('Column costCenter added successfully');
    }
    db.close();
});
