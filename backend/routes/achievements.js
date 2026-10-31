const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/database');

// Available achievements definitions
const ACHIEVEMENTS = {
  first_report: {
    id: 'first_report',
    name: 'Báo cáo đầu tiên',
    description: 'Đã báo cáo sự cố đầu tiên',
    badge_icon: '🎯'
  },
  verified_reporter: {
    id: 'verified_reporter',
    name: 'Người báo cáo đáng tin cậy',
    description: 'Đã có 10 sự cố được xác minh',
    badge_icon: '✅'
  },
  helper: {
    id: 'helper',
    name: 'Người giúp đỡ',
    description: 'Đã giải quyết 20 sự cố',
    badge_icon: '🤝'
  },
  top_contributor: {
    id: 'top_contributor',
    name: 'Người đóng góp hàng đầu',
    description: 'Đã báo cáo 50 sự cố',
    badge_icon: '🏆'
  },
  night_owl: {
    id: 'night_owl',
    name: 'Cú đêm',
    description: 'Đã báo cáo sự cố sau 22h',
    badge_icon: '🦉'
  },
  early_bird: {
    id: 'early_bird',
    name: 'Chim sớm',
    description: 'Đã báo cáo sự cố trước 6h',
    badge_icon: '🐦'
  },
  bug_hunter: {
    id: 'bug_hunter',
    name: 'Săn lỗi',
    description: 'Đã báo cáo 5 lỗi hệ thống',
    badge_icon: '🐛'
  },
  safety_first: {
    id: 'safety_first',
    name: 'An toàn là trên hết',
    description: 'Đã báo cáo 10 sự cố nghiêm trọng',
    badge_icon: '🛡️'
  },
  community_hero: {
    id: 'community_hero',
    name: 'Anh hùng cộng đồng',
    description: 'Đã đạt mức danh tiếng vàng',
    badge_icon: '🦸'
  },
  legend: {
    id: 'legend',
    name: 'Huyền thoại',
    description: 'Đã đạt mức danh tiếng kim cương',
    badge_icon: '💎'
  }
};

// Get all available achievements
router.get('/available', async (req, res) => {
  try {
    res.json({ achievements: Object.values(ACHIEVEMENTS) });
  } catch (error) {
    console.error('Get available achievements error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get user's achievements
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_achievements WHERE user_id = $1 ORDER BY earned_at DESC',
      [req.params.userId]
    );

    res.json({ achievements: result.rows });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get current user's achievements
router.get('/my', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_achievements WHERE user_id = $1 ORDER BY earned_at DESC',
      [req.user.id]
    );

    res.json({ achievements: result.rows });
  } catch (error) {
    console.error('Get my achievements error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Award achievement to user (admin only)
router.post('/award', auth, async (req, res) => {
  try {
    const { user_id, achievement_id } = req.body;

    // Only admins can award achievements
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized to award achievements', status: 403 } });
    }

    // Check if achievement exists
    const achievement = ACHIEVEMENTS[achievement_id];
    if (!achievement) {
      return res.status(404).json({ error: { message: 'Achievement not found', status: 404 } });
    }

    // Check if user already has this achievement
    const existingResult = await pool.query(
      'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
      [user_id, achievement_id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: { message: 'User already has this achievement', status: 409 } });
    }

    // Award achievement
    const result = await pool.query(
      `INSERT INTO user_achievements (user_id, achievement_id, achievement_name, achievement_description, badge_icon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, achievement_id, achievement.name, achievement.description, achievement.badge_icon]
    );

    res.status(201).json({ message: 'Achievement awarded successfully', achievement: result.rows[0] });
  } catch (error) {
    console.error('Award achievement error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Check and award achievements automatically
async function checkAndAwardAchievements(userId) {
  try {
    // Get user stats
    const incidentsResult = await pool.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN verified_by IS NOT NULL THEN 1 END) as verified FROM incidents WHERE user_id = $1',
      [userId]
    );

    const userResult = await pool.query(
      'SELECT reputation_level FROM users WHERE id = $1',
      [userId]
    );

    const stats = {
      total_incidents: parseInt(incidentsResult.rows[0].total || 0),
      verified_incidents: parseInt(incidentsResult.rows[0].verified || 0),
      reputation_level: userResult.rows[0]?.reputation_level || 'bronze'
    };

    const achievementsToAward = [];

    // Check first_report
    if (stats.total_incidents >= 1) {
      achievementsToAward.push(ACHIEVEMENTS.first_report);
    }

    // Check verified_reporter
    if (stats.verified_incidents >= 10) {
      achievementsToAward.push(ACHIEVEMENTS.verified_reporter);
    }

    // Check top_contributor
    if (stats.total_incidents >= 50) {
      achievementsToAward.push(ACHIEVEMENTS.top_contributor);
    }

    // Check community_hero
    if (stats.reputation_level === 'gold') {
      achievementsToAward.push(ACHIEVEMENTS.community_hero);
    }

    // Check legend
    if (stats.reputation_level === 'diamond') {
      achievementsToAward.push(ACHIEVEMENTS.legend);
    }

    // Award achievements
    for (const achievement of achievementsToAward) {
      const existingResult = await pool.query(
        'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
        [userId, achievement.id]
      );

      if (existingResult.rows.length === 0) {
        await pool.query(
          `INSERT INTO user_achievements (user_id, achievement_id, achievement_name, achievement_description, badge_icon)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, achievement.id, achievement.name, achievement.description, achievement.badge_icon]
        );
        console.log(`Awarded achievement ${achievement.id} to user ${userId}`);
      }
    }
  } catch (error) {
    console.error('Check and award achievements error:', error);
  }
}

module.exports = router;
module.exports.checkAndAwardAchievements = checkAndAwardAchievements;
