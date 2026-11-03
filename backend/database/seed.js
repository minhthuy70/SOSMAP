const pool = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Database seeding script for development
 * Run with: node database/seed.js
 */

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data (optional - comment out if you want to preserve data)
    // await pool.query('TRUNCATE TABLE incident_comments, incident_ratings, incident_relations, incidents, users CASCADE');

    // Seed Users
    console.log('Seeding users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    const users = await pool.query(`
      INSERT INTO users (email, password, name, phone, role, reputation_points, reputation_level) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7),
        ($8, $9, $10, $11, $12, $13, $14),
        ($15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [
      'admin@sosmap.vn', adminPassword, 'Admin User', '0901234567', 'admin', 1000, 'diamond',
      'user1@sosmap.vn', userPassword, 'Nguyen Van A', '0902345678', 'user', 150, 'silver',
      'user2@sosmap.vn', userPassword, 'Tran Thi B', '0903456789', 'user', 300, 'gold'
    ]);

    console.log(`Seeded ${users.rows.length} users`);

    const userIds = users.rows.map(u => u.id);

    // Seed Incidents
    console.log('Seeding incidents...');
    const incidentTypes = ['traffic', 'flood', 'fire', 'accident', 'construction', 'weather'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const statuses = ['pending', 'verified', 'in_progress', 'resolved', 'rejected'];

    const incidents = [];
    for (let i = 0; i < 20; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const type = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Random coordinates around Hanoi
      const baseLat = 21.0285;
      const baseLon = 105.8542;
      const lat = baseLat + (Math.random() - 0.5) * 0.1;
      const lon = baseLon + (Math.random() - 0.5) * 0.1;

      const result = await pool.query(`
        INSERT INTO incidents (
          user_id, type, title, description, latitude, longitude, 
          severity, status, province_code, address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        userId,
        type,
        `${type.charAt(0).toUpperCase() + type.slice(1)} Incident ${i + 1}`,
        `This is a sample ${type} incident for testing purposes.`,
        lat,
        lon,
        severity,
        status,
        '01', // Hanoi
        `Sample Address ${i + 1}, Hanoi`
      ]);

      incidents.push({ id: result.rows[0].id, userId });
    }

    console.log(`Seeded ${incidents.length} incidents`);

    // Seed Incident Comments
    console.log('Seeding incident comments...');
    for (let i = 0; i < 15; i++) {
      const incident = incidents[Math.floor(Math.random() * incidents.length)];
      const userId = userIds[Math.floor(Math.random() * userIds.length)];

      await pool.query(`
        INSERT INTO incident_comments (incident_id, user_id, comment)
        VALUES ($1, $2, $3)
      `, [incident.id, userId, `Sample comment ${i + 1} for testing`]);
    }

    console.log('Seeded incident comments');

    // Seed Incident Ratings
    console.log('Seeding incident ratings...');
    for (let i = 0; i < 15; i++) {
      const incident = incidents[Math.floor(Math.random() * incidents.length)];
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const rating = Math.floor(Math.random() * 5) + 1;

      await pool.query(`
        INSERT INTO incident_ratings (incident_id, user_id, rating)
        VALUES ($1, $2, $3)
        ON CONFLICT (incident_id, user_id) DO NOTHING
      `, [incident.id, userId, rating]);
    }

    console.log('Seeded incident ratings');

    // Seed User Achievements
    console.log('Seeding user achievements...');
    const achievementTypes = ['first_report', 'verified_helper', 'top_reporter', 'community_star'];
    
    for (const userId of userIds) {
      for (const type of achievementTypes) {
        await pool.query(`
          INSERT INTO user_achievements (user_id, achievement_type, earned_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id, achievement_type) DO NOTHING
        `, [userId, type]);
      }
    }

    console.log('Seeded user achievements');

    // Seed Audit Logs
    console.log('Seeding audit logs...');
    const auditActions = ['create', 'update', 'delete', 'login', 'logout'];
    
    for (let i = 0; i < 10; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const action = auditActions[Math.floor(Math.random() * auditActions.length)];

      await pool.query(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, action, 'incident', Math.floor(Math.random() * 100), JSON.stringify({ seed: true })]);
    }

    console.log('Seeded audit logs');

    console.log('Database seeding completed successfully!');
    console.log('\nTest credentials:');
    console.log('Admin: admin@sosmap.vn / admin123');
    console.log('User: user1@sosmap.vn / user123');
    console.log('User: user2@sosmap.vn / user123');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
