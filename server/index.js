const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

// Define base data directory (use USER_DATA_PATH from Electron if available, else __dirname)
const DATA_DIR = process.env.USER_DATA_PATH || __dirname;
// Define database path (use DATABASE_PATH from Electron if available, else fallback)
const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, 'database.sqlite');

console.log('Server running with DATA_DIR:', DATA_DIR);
console.log('Server running with DB_PATH:', DB_PATH);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads')));

// Ensure upload directories exist
const uploadDirs = ['uploads', 'uploads/employees', 'uploads/documents', 'backups'];
uploadDirs.forEach(dir => {
    const dirPath = path.join(DATA_DIR, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Configure Multer for employee photos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(DATA_DIR, 'uploads/employees/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'employee-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
    }
});

// Configure Multer for documents
const docStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(DATA_DIR, 'uploads/documents/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadDoc = multer({
    storage: docStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Accept common document types + images
        const filetypes = /pdf|doc|docx|xls|xlsx|txt|jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        // Mime check is looser for loose matching or just rely on extname for simplicity in internal tool
        if (extname) {
            return cb(null, true);
        }
        cb(new Error("FileType not allowed"));
    }
});



// Database Setup
const sequelize = require('./database');

// Models
const Employee = require('./models/Employee');
const Department = require('./models/Department');
const CostCenter = require('./models/CostCenter');
const Document = require('./models/Document');
const Building = require('./models/Building');
const Apartment = require('./models/Apartment');
const Room = require('./models/Room');

const LoanHistory = require('./models/LoanHistory');
const Vacation = require('./models/Vacation');
const Salary = require('./models/Salary');

// Define Associations
Department.hasMany(Department, { as: 'children', foreignKey: 'parentId' });
Department.belongsTo(Department, { as: 'parent', foreignKey: 'parentId' });

Building.hasMany(Apartment, { as: 'apartments', foreignKey: 'buildingId', onDelete: 'CASCADE' });
Apartment.belongsTo(Building, { foreignKey: 'buildingId' });

Apartment.hasMany(Room, { as: 'rooms', foreignKey: 'apartmentId', onDelete: 'CASCADE' });
Room.belongsTo(Apartment, { foreignKey: 'apartmentId' });

Room.belongsTo(Employee, { as: 'permanentResident', foreignKey: 'permanentResidentId' });
Room.belongsTo(Employee, { as: 'temporaryResident', foreignKey: 'temporaryResidentId' });

Employee.hasOne(Room, { as: 'permanentRoom', foreignKey: 'permanentResidentId' });
Employee.hasOne(Room, { as: 'temporaryRoom', foreignKey: 'temporaryResidentId' });

Employee.hasMany(LoanHistory, { as: 'loanHistory', foreignKey: 'employeeId', onDelete: 'CASCADE' });
LoanHistory.belongsTo(Employee, { foreignKey: 'employeeId' });

Employee.hasMany(Document, { as: 'documents', foreignKey: 'employeeId', onDelete: 'CASCADE' });

Document.belongsTo(Employee, { foreignKey: 'employeeId' });

Employee.hasMany(Vacation, { as: 'vacations', foreignKey: 'employeeId', onDelete: 'CASCADE' });
Vacation.belongsTo(Employee, { foreignKey: 'employeeId' });

Employee.hasMany(Salary, { as: 'salaries', foreignKey: 'employeeId', onDelete: 'CASCADE' });
Salary.belongsTo(Employee, { foreignKey: 'employeeId' });

// Health check for diagnostics
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: !!sequelize });
});

// Photo upload endpoint
app.post('/api/upload-photo', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
        url: `/uploads/employees/${req.file.filename}`,
        filename: req.file.filename
    });
});

// --- Departments ---
app.get('/api/departments', async (req, res) => {
    try {
        const departments = await Department.findAll();
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/departments', async (req, res) => {
    try {
        const department = await Department.create(req.body);
        res.status(201).json(department);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/departments/:id', async (req, res) => {
    try {
        const department = await Department.findByPk(req.params.id);
        if (department) {
            await department.update(req.body);
            res.json(department);
        } else {
            res.status(404).json({ error: 'Department not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/departments/:id', async (req, res) => {
    try {
        const result = await Department.destroy({ where: { id: req.params.id } });
        if (result) res.status(204).send();
        else res.status(404).json({ error: 'Department not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Cost Centers ---
app.get('/api/cost-centers', async (req, res) => {
    try {
        const costCenters = await CostCenter.findAll();
        res.json(costCenters);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/cost-centers', async (req, res) => {
    try {
        const costCenter = await CostCenter.create(req.body);
        res.status(201).json(costCenter);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// --- Vacations ---
app.get('/api/vacations', async (req, res) => {
    try {
        const { employeeId, start, end } = req.query;
        const where = {};
        if (employeeId) where.employeeId = employeeId;

        // Optional date filtering logic could go here

        const vacations = await Vacation.findAll({
            where,
            include: [{ model: Employee, attributes: ['firstName', 'lastName'] }],
            order: [['startDate', 'DESC']]
        });
        res.json(vacations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vacations', async (req, res) => {
    try {
        const vacation = await Vacation.create(req.body);

        // Also update the employee's current status if needed
        // For now, we trust the frontend to update the employee record separately via PUT /api/employees/:id
        // OR we could do it here automatically. Let's keep it separate for now or do it here?
        // User wants integration. 
        // Better: When a vacation is created, we assume the employee is ON vacation or scheduled.
        // But for simplicity, we just store the record. The Report will read this table.

        res.status(201).json(vacation);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
app.delete('/api/cost-centers/:id', async (req, res) => {
    try {
        const result = await CostCenter.destroy({ where: { id: req.params.id } });
        if (result) res.status(204).send();
        else res.status(404).json({ error: 'Cost Center not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- Loan History ---
app.get('/api/employees/:id/loan-history', async (req, res) => {
    try {
        const history = await LoanHistory.findAll({
            where: { employeeId: req.params.id },
            order: [['startDate', 'DESC']]
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/employees/:id/loan-history', async (req, res) => {
    try {
        const history = await LoanHistory.create({
            employeeId: req.params.id,
            ...req.body
        });
        res.status(201).json(history);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/loan-history/:id', async (req, res) => {
    try {
        const result = await LoanHistory.destroy({ where: { id: req.params.id } });
        if (result) res.status(204).send();
        else res.status(404).json({ error: 'Record not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Documents ---
app.post('/api/employees/:id/documents', uploadDoc.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const document = await Document.create({
            employeeId: req.params.id,
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
        });
        res.status(201).json(document);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/employees/:id/documents', async (req, res) => {
    try {
        const documents = await Document.findAll({
            where: { employeeId: req.params.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Salaries ---
app.get('/api/salaries', async (req, res) => {
    try {
        const { month } = req.query;
        if (!month) return res.status(400).json({ error: 'Month is required (YYYY-MM)' });

        const salaries = await Salary.findAll({
            where: { month },
            include: [{
                model: Employee,
                attributes: ['id', 'firstName', 'lastName', 'position', 'salary', 'isActive', 'department']
            }]
        });
        res.json(salaries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/salaries/init', async (req, res) => {
    try {
        const { month } = req.query;
        if (!month) return res.status(400).json({ error: 'Month is required (YYYY-MM)' });

        // Get all active employees
        const employees = await Employee.findAll({
            where: { isActive: true }
        });

        // Get existing records for this month
        const existing = await Salary.findAll({
            where: { month },
            include: [{
                model: Employee,
                attributes: ['id', 'firstName', 'lastName', 'position', 'salary', 'isActive', 'department']
            }]
        });
        const existingEmpIds = new Set(existing.map(s => s.employeeId));

        // Create virtual records for those missing
        const virtualRecords = employees
            .filter(emp => !existingEmpIds.has(emp.id))
            .map(emp => ({
                employeeId: emp.id,
                month,
                attendedDays: 30,
                deductions: 0,
                baseSalary: emp.salary || 0,
                // Simple net calculation: (salary / 30 * days) - deductions
                netSalary: emp.salary || 0,
                Employee: emp
            }));

        res.json([...existing, ...virtualRecords]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/salaries/year', async (req, res) => {
    try {
        const { year } = req.query;
        if (!year) return res.status(400).json({ error: 'Year is required (YYYY)' });

        const { Op } = require('sequelize');
        const salaries = await Salary.findAll({
            where: {
                month: {
                    [Op.like]: `${year}-%`
                }
            },
            include: [{
                model: Employee,
                attributes: ['id', 'firstName', 'lastName', 'position', 'salary', 'isActive', 'department']
            }],
            order: [['month', 'ASC']]
        });
        res.json(salaries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/salaries/bulk', async (req, res) => {
    try {
        const { month, records } = req.body;
        if (!month || !records) return res.status(400).json({ error: 'Month and records are required' });

        for (const record of records) {
            const { employeeId, attendedDays, deductions, baseSalary, netSalary, notes } = record;

            // Upsert logic
            const [salary, created] = await Salary.findOrCreate({
                where: { employeeId, month },
                defaults: { attendedDays, deductions, baseSalary, netSalary, notes }
            });

            if (!created) {
                await salary.update({ attendedDays, deductions, baseSalary, netSalary, notes });
            }
        }

        res.json({ message: 'Salaries updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.delete('/api/documents/:id', async (req, res) => {
    try {
        const document = await Document.findByPk(req.params.id);
        if (!document) return res.status(404).json({ error: 'Document not found' });

        // Remove from disk
        const filePath = path.join(DATA_DIR, 'uploads/documents', document.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await document.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Dashboard ---
app.get('/api/dashboard/expiring-contracts', async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const now = new Date();

        const expiringEmployees = await Employee.findAll({
            where: {
                contractEndDate: {
                    [Op.and]: {
                        [Op.ne]: null,
                        [Op.lt]: thirtyDaysFromNow
                    }
                },
                isActive: true
            }
        });
        res.json(expiringEmployees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/dashboard/stay-alerts', async (req, res) => {
    try {
        const { Op } = require('sequelize');

        const employees = await Employee.findAll({
            where: {
                arrivalDate: {
                    [Op.ne]: null
                },
                isActive: true
            }
        });

        const alertList = employees.filter(emp => {
            const arrival = new Date(emp.arrivalDate);
            const fourMonthsMark = new Date(arrival);
            fourMonthsMark.setMonth(fourMonthsMark.getMonth() + 4);

            const alertStartDate = new Date(fourMonthsMark);
            alertStartDate.setDate(alertStartDate.getDate() - 10);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return today >= alertStartDate;
        }).map(emp => {
            const arrival = new Date(emp.arrivalDate);
            const fourMonthsMark = new Date(arrival);
            fourMonthsMark.setMonth(fourMonthsMark.getMonth() + 4);

            return {
                ...emp.toJSON(),
                fourMonthsDate: fourMonthsMark.toISOString().split('T')[0]
            };
        });

        res.json(alertList);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/dashboard/vacation-alerts', async (req, res) => {
    try {
        const { Op } = require('sequelize');

        const employees = await Employee.findAll({
            where: {
                vacationReturnDate: {
                    [Op.ne]: null
                },
                isActive: true
            }
        });

        const alertList = employees.filter(emp => {
            const returnDate = new Date(emp.vacationReturnDate);
            const alertStartDate = new Date(returnDate);
            alertStartDate.setDate(alertStartDate.getDate() - 10);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const returnDateMs = returnDate.getTime();
            const todayMs = today.getTime();
            const alertStartMs = alertStartDate.getTime();

            return todayMs >= alertStartMs && todayMs < returnDateMs;
        });

        res.json(alertList);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get residence statistics for dashboard
app.get('/api/dashboard/residence-stats', async (req, res) => {
    try {
        const buildings = await Building.findAll({
            include: [{
                model: Apartment,
                as: 'apartments',
                include: [{
                    model: Room,
                    as: 'rooms'
                }]
            }]
        });

        let totalRooms = 0;
        let occupiedRooms = 0;

        buildings.forEach(building => {
            building.apartments?.forEach(apt => {
                totalRooms += apt.rooms?.length || 0;
                occupiedRooms += apt.rooms?.filter(r => r.permanentResidentId || r.temporaryResidentId).length || 0;
            });
        });

        res.json({
            totalBuildings: buildings.length,
            totalRooms,
            occupiedRooms,
            occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Settings & Administration (الإعدادات) ---

// Database Backup
// Configure Multer for DB Restore
const restoreStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(DATA_DIR, 'uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, 'restore_temp.sqlite');
    }
});
const uploadRestore = multer({ storage: restoreStorage });

// Database Backup (Download)
app.get('/api/settings/backup', async (req, res) => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return res.status(404).json({ error: 'Database file not found' });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-gomaadb-${timestamp}.sqlite`;

        res.download(DB_PATH, filename);
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Database Restore
app.post('/api/settings/restore', uploadRestore.single('database'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const tempPath = req.file.path;
        // Use defined DB_PATH
        const dbPath = DB_PATH;
        const backupPath = DB_PATH + '.bak';

        // 1. Validate File Size
        const stats = fs.statSync(tempPath);
        if (stats.size === 0) {
            fs.unlinkSync(tempPath);
            return res.status(400).json({ error: 'ملف النسخة الاحتياطية فارغ' });
        }

        // 2. Validate SQLite Magic Header
        const fd = fs.openSync(tempPath, 'r');
        const buffer = Buffer.alloc(16);
        fs.readSync(fd, buffer, 0, 16, 0);
        fs.closeSync(fd);
        const header = buffer.toString('utf-8');

        if (!header.startsWith('SQLite format 3')) {
            fs.unlinkSync(tempPath);
            return res.status(400).json({ error: 'الملف المرفق ليس قاعدة بيانات صالحة (Invalid SQLite file)' });
        }

        // Close connection to release file lock
        try {
            await sequelize.close();
            console.log('Database connection closed for restore.');
        } catch (e) {
            console.warn('Could not close DB connection (might be already closed):', e);
        }

        // Wait brief moment for locks to release
        await new Promise(resolve => setTimeout(resolve, 500));

        // 3. Safety Backup of CURRENT Data
        if (fs.existsSync(dbPath)) {
            try {
                fs.copyFileSync(dbPath, backupPath);
                console.log('Created safety backup at:', backupPath);
            } catch (err) {
                console.error('Failed to create safety backup:', err);
                // Decide if we should proceed? Yes, but warn log.
            }
        }

        // 4. Overwrite Database
        fs.copyFileSync(tempPath, dbPath);
        fs.unlinkSync(tempPath); // Clean up temp

        console.log('Database restored from backup. Restarting server...');

        res.json({
            message: 'تم استعادة قاعدة البيانات بنجاح. سيتم إعادة تشغيل الخادم...',
            restartRequired: true
        });

        // Trigger safe restart after response sends
        setTimeout(() => {
            process.exit(99); // Exit code 99 triggers restart in electron main.js
        }, 1000);

    } catch (error) {
        console.error('Restore error:', error);
        // Try to clean up temp if exists
        try { if (req.file) fs.unlinkSync(req.file.path); } catch (e) { }
        res.status(500).json({ error: 'Restore failed: ' + error.message });
    }
});

// Export Employees to CSV
app.get('/api/settings/export-employees', async (req, res) => {
    try {
        const employees = await Employee.findAll();

        const headers = [
            'ID', 'الاسم الأول', 'اسم العائلة', 'الرقم الثابت', 'البريد الإلكتروني',
            'الوظيفة', 'القسم', 'مركز التكلفة', 'دور العمل', 'الراتب',
            'تاريخ التعيين', 'بداية العقد', 'نهاية العقد',
            'تاريخ الوصول', 'تاريخ العودة من الأجازة',
            'المؤهل', 'تاريخ المؤهل',
            'الحالة الاجتماعية',
            'الدرجة', 'تاريخ الدرجة',
            'تاريخ المسمى الوظيفي الحالي',
            'بداية السلفة', 'نهاية السلفة',
            'الحالة (نشط)'
        ];

        const rows = employees.map(emp => [
            emp.id,
            emp.firstName,
            emp.lastName,
            emp.fixedNumber,
            emp.email || '',
            emp.position,
            emp.department,
            emp.costCenter || '',
            emp.jobRole,
            emp.salary,
            emp.dateHired,
            emp.contractStartDate,
            emp.contractEndDate,
            emp.arrivalDate,
            emp.vacationReturnDate || '',
            emp.qualification || '',
            emp.qualificationDate || '',
            emp.maritalStatus || '',
            emp.grade || '',
            emp.gradeDate || '',
            emp.currentJobTitleDate || '',
            emp.loanStartDate || '',
            emp.loanEndDate || '',
            emp.isActive ? 'نشط' : 'غير نشط'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `employees-export-${timestamp}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        // Add UTF-8 BOM for Excel visibility
        res.send('\uFEFF' + csvContent);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Database Info
app.get('/api/settings/db-info', async (req, res) => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return res.status(404).json({ error: 'Database file not found' });
        }

        const stats = fs.statSync(DB_PATH);
        res.json({
            size: (stats.size / 1024 / 1024).toFixed(2), // MB
            lastModified: stats.mtime,
            path: DB_PATH
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Residence Management (الاستراحات) ---

// Get all buildings with summary info
app.get('/api/residences/buildings', async (req, res) => {
    try {
        const buildings = await Building.findAll({
            include: [{
                model: Apartment,
                as: 'apartments',
                include: [{
                    model: Room,
                    as: 'rooms'
                }]
            }]
        });
        res.json(buildings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create building
app.post('/api/residences/buildings', async (req, res) => {
    try {
        const building = await Building.create(req.body);
        res.status(201).json(building);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get building details (Apartments and Rooms)
app.get('/api/residences/buildings/:id', async (req, res) => {
    try {
        const building = await Building.findByPk(req.params.id, {
            include: [{
                model: Apartment,
                as: 'apartments',
                include: [{
                    model: Room,
                    as: 'rooms',
                    include: [
                        { model: Employee, as: 'permanentResident' },
                        { model: Employee, as: 'temporaryResident' }
                    ]
                }]
            }]
        });
        if (building) res.json(building);
        else res.status(404).json({ error: 'Building not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create apartment
app.post('/api/residences/apartments', async (req, res) => {
    try {
        const apartment = await Apartment.create(req.body);
        res.status(201).json(apartment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update apartment
app.put('/api/residences/apartments/:id', async (req, res) => {
    try {
        const apartment = await Apartment.findByPk(req.params.id);
        if (apartment) {
            await apartment.update(req.body);
            res.json(apartment);
        } else {
            res.status(404).json({ error: 'Apartment not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete apartment
app.delete('/api/residences/apartments/:id', async (req, res) => {
    try {
        const count = await Apartment.destroy({ where: { id: req.params.id } });
        if (count) res.status(204).send();
        else res.status(404).json({ error: 'Apartment not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create room
app.post('/api/residences/rooms', async (req, res) => {
    try {
        const room = await Room.create(req.body);
        res.status(201).json(room);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update room (assignment or number)
app.put('/api/residences/rooms/:id', async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);
        if (room) {
            await room.update(req.body);
            res.json(room);
        } else {
            res.status(404).json({ error: 'Room not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete room
app.delete('/api/residences/rooms/:id', async (req, res) => {
    try {
        const count = await Room.destroy({ where: { id: req.params.id } });
        if (count) res.status(204).send();
        else res.status(404).json({ error: 'Room not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete building
app.delete('/api/residences/buildings/:id', async (req, res) => {
    try {
        const count = await Building.destroy({ where: { id: req.params.id } });
        if (count) res.status(204).send();
        else res.status(404).json({ error: 'Building not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Employees ---
// Get all employees
app.get('/api/employees', async (req, res) => {
    try {
        const employees = await Employee.findAll({
            include: [
                {
                    model: Room,
                    as: 'permanentRoom',
                    include: [{
                        model: Apartment,
                        include: [Building]
                    }]
                },
                {
                    model: Room,
                    as: 'temporaryRoom',
                    include: [{
                        model: Apartment,
                        include: [Building]
                    }]
                }
            ]
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get employee by ID
app.get('/api/employees/:id', async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            include: [
                {
                    model: Room,
                    as: 'permanentRoom',
                    include: [{ model: Apartment, include: [Building] }]
                },
                {
                    model: Room,
                    as: 'temporaryRoom',
                    include: [{ model: Apartment, include: [Building] }]
                }
            ]
        });
        if (employee) {
            res.json(employee);
        } else {
            res.status(404).json({ error: 'Employee not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create employee
app.post('/api/employees', async (req, res) => {
    try {
        const employeeData = { ...req.body };
        ['dateHired', 'contractStartDate', 'contractEndDate', 'arrivalDate', 'vacationReturnDate', 'vacationStartDate'].forEach(key => {
            if (employeeData[key] === '') employeeData[key] = null;
        });

        if (employeeData.contractStartDate) {
            const startDate = new Date(employeeData.contractStartDate);
            if (!isNaN(startDate.getTime())) {
                const endDate = new Date(startDate);
                endDate.setFullYear(endDate.getFullYear() + 2);
                employeeData.contractEndDate = endDate.toISOString().split('T')[0];
            }
        }
        const employee = await Employee.create(employeeData);
        res.status(201).json(employee);
    } catch (error) {
        console.error('Create employee error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update employee
app.put('/api/employees/:id', async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (employee) {
            const { id, createdAt, updatedAt, ...updateData } = req.body;

            // Convert empty strings to null for date fields
            ['dateHired', 'contractStartDate', 'contractEndDate', 'arrivalDate', 'vacationReturnDate', 'vacationStartDate'].forEach(key => {
                if (updateData[key] === '') updateData[key] = null;
            });

            if (updateData.contractStartDate) {
                const startDate = new Date(updateData.contractStartDate);
                if (!isNaN(startDate.getTime())) {
                    const endDate = new Date(startDate);
                    endDate.setFullYear(endDate.getFullYear() + 2);
                    updateData.contractEndDate = endDate.toISOString().split('T')[0];
                }
            }
            // Force strict boolean for isActive if present
            if (updateData.isActive !== undefined) {
                updateData.isActive = updateData.isActive === true || updateData.isActive === 'true' || updateData.isActive === 1 || updateData.isActive === '1';
            }

            // If becoming inactive, clear Cost Center and Residence assignments
            if (updateData.isActive === false) {
                updateData.costCenter = null;

                // Remove from Rooms (both permanent and temporary)
                // We need to handle this asynchronously but we want to ensure it happens
                try {
                    await Room.update(
                        { permanentResidentId: null },
                        { where: { permanentResidentId: req.params.id } }
                    );
                    await Room.update(
                        { temporaryResidentId: null },
                        { where: { temporaryResidentId: req.params.id } }
                    );
                } catch (roomError) {
                    console.error('Error removing inactive employee from rooms:', roomError);
                }
            }

            await employee.update(updateData);
            res.json(employee);
        } else {
            res.status(404).json({ error: 'Employee not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (employee) {
            await employee.destroy();
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Employee not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
// Sync Database and Start Server
console.log('Starting server...');

const startServer = () => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

const runMigrations = async () => {
    try {
        // Manually check/add parentId to Departments for robustness
        const [results] = await sequelize.query("PRAGMA table_info(Departments);");
        const hasParentId = results.some(col => col.name === 'parentId');

        if (!hasParentId) {
            console.log('Migrating: Adding parentId to Departments...');
            await sequelize.query("ALTER TABLE Departments ADD COLUMN parentId INTEGER REFERENCES Departments(id);");
            console.log('Migration successful.');
        } else {
            console.log('Schema check: Departments.parentId exists.');
        }

        // Migration: Comprehensive check for potentially missing Employee columns
        const [empResults] = await sequelize.query("PRAGMA table_info(Employees);");
        const existingColumns = empResults.map(col => col.name);

        const columnsToCheck = [
            'departmentBeforeLoan',
            'currentWorkLocation',
            'cairoPhone',
            'cameroonPhone',
            'address',
            'efficiencyReport',
            'photoUrl',
            'loanStartDate',
            'loanEndDate',
            'qualification',
            'qualificationDate',
            'vacationStartDate',
            'maritalStatus',
            'grade',
            'gradeDate',
            'currentJobTitleDate',
            'airline',
            'arrivalDateBeforeVacation',
            'travelDate'
        ];

        for (const colName of columnsToCheck) {
            if (!existingColumns.includes(colName)) {
                console.log(`Migrating: Adding missing column '${colName}' to Employees...`);
                // Use generic VARCHAR/TEXT for flexibility or DATE where appropriate, 
                // but for SQLite simple adds, VARCHAR/TEXT is safest for strings/dates.
                // Using general type VARCHAR(255) covering strings and ISO dates.
                await sequelize.query(`ALTER TABLE Employees ADD COLUMN ${colName} VARCHAR(255);`);
                console.log(`Migration successful: '${colName}' added.`);
            }
        }
        console.log('Schema check: Employee columns verified.');

        // Standard sync for other tables (safe, doesn't alter existing columns)
        await sequelize.sync();
        console.log('Database sync successful.');

        // Migration for Vacations table
        const [vacResults] = await sequelize.query("PRAGMA table_info(Vacations);");
        const existingVacColumns = vacResults.map(col => col.name);
        if (!existingVacColumns.includes('travelDate')) {
            console.log("Migrating: Adding 'travelDate' to Vacations...");
            await sequelize.query("ALTER TABLE Vacations ADD COLUMN travelDate VARCHAR(255);");
        }

        startServer();
    } catch (error) {
        console.error('Startup/Migration failed:', error);

        // Try starting anyway, maybe sync worked partially
        startServer();
    }
};

runMigrations();
