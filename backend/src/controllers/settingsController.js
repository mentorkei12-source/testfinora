const pool = require('../../config/database');
const { logAudit } = require('../middleware/auth');

// GET /api/settings (public)
const getPublicSettings = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT key, value FROM settings WHERE key IN ('site_name', 'site_tagline', 'currency', 'whatsapp_group_link', 'whatsapp_support_number', 'deposit_instructions', 'deposit_phone', 'maintenance_mode')"
    );
    const settings = {};
    result.rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

// GET /api/admin/settings
const getAllSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings ORDER BY key');
    const settings = {};
    result.rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

// PUT /api/admin/settings
const updateSettings = async (req, res) => {
  const client = await pool.connect();
  try {
    const updates = req.body; // { key: value, ... }
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(updates)) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
    }
    await client.query('COMMIT');
    await logAudit(req.admin.id, 'UPDATE_SETTINGS', 'settings', null, null, updates, req);
    res.json({ message: 'Settings updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to update settings' });
  } finally {
    client.release();
  }
};

// GET /api/announcements (public)
const getAnnouncements = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, content, type, created_at FROM announcements WHERE is_active = true ORDER BY created_at DESC LIMIT 10'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
};

// Admin: POST create announcement
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, type } = req.body;
    const result = await pool.query(
      'INSERT INTO announcements (title, content, type, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, content, type || 'info', req.admin.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create announcement' });
  }
};

// Admin: PUT update announcement
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, is_active } = req.body;
    const result = await pool.query(
      'UPDATE announcements SET title=$1, content=$2, type=$3, is_active=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
      [title, content, type, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update announcement' });
  }
};

// Admin: DELETE announcement
const deleteAnnouncement = async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
};

// Admin: GET audit logs
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT al.*, a.name as admin_name FROM audit_logs al
       LEFT JOIN admins a ON al.admin_id = a.id
       ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

// User: GET notifications
const getUserNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// User: PUT mark notification read
const markNotificationRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND id = $2',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

module.exports = {
  getPublicSettings, getAllSettings, updateSettings,
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getAuditLogs, getUserNotifications, markNotificationRead
};
