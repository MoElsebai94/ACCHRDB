const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log(`Inspecting database at: ${dbPath}`);
    db.all("PRAGMA table_info(Departments)", (err, rows) => {
        if (err) {
            console.error("Error getting table info:", err);
            return;
        }
        console.log("Departments Table Columns:");
        console.table(rows);
    });
});

db.close();
