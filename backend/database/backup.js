const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

/**
 * Database backup and restore utility
 * 
 * Usage:
 * node database/backup.js backup [filename]
 * node database/backup.js restore [filename]
 */

const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create database backup
 */
async function createBackup(filename = null) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = filename || `sosmap-backup-${timestamp}.sql`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    const { PGDATABASE, PGHOST, PGPORT, PGUSER, PGPASSWORD } = process.env;

    if (!PGDATABASE) {
      throw new Error('PGDATABASE environment variable is required');
    }

    console.log(`Creating backup of database: ${PGDATABASE}`);
    console.log(`Backup file: ${backupPath}`);

    const pgDumpCommand = `pg_dump -h ${PGHOST || 'localhost'} -p ${PGPORT || 5432} -U ${PGUSER || 'postgres'} -d ${PGDATABASE} -F c -f "${backupPath}"`;

    await new Promise((resolve, reject) => {
      exec(pgDumpCommand, { env: { PGPASSWORD } }, (error, stdout, stderr) => {
        if (error) {
          console.error('Backup failed:', error);
          reject(error);
        } else {
          console.log('Backup completed successfully');
          console.log(`Backup saved to: ${backupPath}`);
          resolve();
        }
      });
    });

    return backupPath;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

/**
 * Restore database from backup
 */
async function restoreBackup(filename) {
  try {
    const backupPath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    const { PGDATABASE, PGHOST, PGPORT, PGUSER, PGPASSWORD } = process.env;

    if (!PGDATABASE) {
      throw new Error('PGDATABASE environment variable is required');
    }

    console.log(`Restoring database: ${PGDATABASE}`);
    console.log(`From backup: ${backupPath}`);

    // Drop existing database connections
    await pool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
      AND pid <> pg_backend_pid()
    `, [PGDATABASE]);

    const pgRestoreCommand = `pg_restore -h ${PGHOST || 'localhost'} -p ${PGPORT || 5432} -U ${PGUSER || 'postgres'} -d ${PGDATABASE} -c "${backupPath}"`;

    await new Promise((resolve, reject) => {
      exec(pgRestoreCommand, { env: { PGPASSWORD } }, (error, stdout, stderr) => {
        if (error) {
          console.error('Restore failed:', error);
          reject(error);
        } else {
          console.log('Restore completed successfully');
          resolve();
        }
      });
    });

    return backupPath;
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
}

/**
 * List all backups
 */
function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.sql') || file.endsWith('.backup'))
      .sort()
      .reverse();

    console.log('Available backups:');
    files.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      const created = stats.mtime.toISOString();
      console.log(`  - ${file} (${sizeMB} MB, ${created})`);
    });

    return files;
  } catch (error) {
    console.error('Error listing backups:', error);
    throw error;
  }
}

/**
 * Delete old backups (keep last N backups)
 */
async function cleanupBackups(keepCount = 5) {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.sql') || file.endsWith('.backup'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    const filesToDelete = files.slice(keepCount);

    console.log(`Cleaning up old backups (keeping last ${keepCount})...`);

    for (const file of filesToDelete) {
      fs.unlinkSync(file.path);
      console.log(`Deleted: ${file.name}`);
    }

    console.log(`Cleanup completed. Deleted ${filesToDelete.length} old backups.`);
  } catch (error) {
    console.error('Error cleaning up backups:', error);
    throw error;
  }
}

/**
 * Create SQL backup (plain text format)
 */
async function createSQLBackup(filename = null) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = filename || `sosmap-backup-${timestamp}.sql`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    const { PGDATABASE, PGHOST, PGPORT, PGUSER, PGPASSWORD } = process.env;

    if (!PGDATABASE) {
      throw new Error('PGDATABASE environment variable is required');
    }

    console.log(`Creating SQL backup of database: ${PGDATABASE}`);
    console.log(`Backup file: ${backupPath}`);

    const pgDumpCommand = `pg_dump -h ${PGHOST || 'localhost'} -p ${PGPORT || 5432} -U ${PGUSER || 'postgres'} -d ${PGDATABASE} -f "${backupPath}"`;

    await new Promise((resolve, reject) => {
      exec(pgDumpCommand, { env: { PGPASSWORD } }, (error, stdout, stderr) => {
        if (error) {
          console.error('SQL backup failed:', error);
          reject(error);
        } else {
          console.log('SQL backup completed successfully');
          console.log(`Backup saved to: ${backupPath}`);
          resolve();
        }
      });
    });

    return backupPath;
  } catch (error) {
    console.error('Error creating SQL backup:', error);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const argument = process.argv[3];

  switch (command) {
    case 'backup':
      createBackup(argument)
        .then(() => process.exit(0))
        .catch(err => {
          console.error(err);
          process.exit(1);
        });
      break;

    case 'sql-backup':
      createSQLBackup(argument)
        .then(() => process.exit(0))
        .catch(err => {
          console.error(err);
          process.exit(1);
        });
      break;

    case 'restore':
      if (!argument) {
        console.error('Please specify backup filename');
        console.log('Usage: node database/backup.js restore <filename>');
        process.exit(1);
      }
      restoreBackup(argument)
        .then(() => process.exit(0))
        .catch(err => {
          console.error(err);
          process.exit(1);
        });
      break;

    case 'list':
      listBackups();
      process.exit(0);
      break;

    case 'cleanup':
      const keepCount = parseInt(argument) || 5;
      cleanupBackups(keepCount)
        .then(() => process.exit(0))
        .catch(err => {
          console.error(err);
          process.exit(1);
        });
      break;

    default:
      console.log('Usage:');
      console.log('  node database/backup.js backup [filename]        - Create compressed backup');
      console.log('  node database/backup.js sql-backup [filename]    - Create plain SQL backup');
      console.log('  node database/backup.js restore <filename>      - Restore from backup');
      console.log('  node database/backup.js list                     - List all backups');
      console.log('  node database/backup.js cleanup [keep_count]    - Delete old backups');
      process.exit(1);
  }
}

module.exports = {
  createBackup,
  createSQLBackup,
  restoreBackup,
  listBackups,
  cleanupBackups
};
