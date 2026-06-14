const jwt = require('jsonwebtoken');
const pool = require('../../config/database');

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      'SELECT id, full_name, username, phone, wallet_balance, is_active, is_banned, language FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!result.rows[0]) return res.status(401).json({ message: 'User not found' });
    if (result.rows[0].is_banned) return res.status(403).json({ message: 'Account suspended' });
    if (!result.rows[0].is_active) return res.status(403).json({ message: 'Account inactive' });

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    const result = await pool.query(
      'SELECT id, name, email, role, is_active FROM admins WHERE id = $1',
      [decoded.id]
    );

    if (!result.rows[0]) return res.status(401).json({ message: 'Admin not found' });
    if (!result.rows[0].is_active) return res.status(403).json({ message: 'Admin account inactive' });

    req.admin = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const logAudit = async (adminId, action, entityType, entityId, oldValues, newValues, req) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [adminId, action, entityType, entityId,
       oldValues ? JSON.stringify(oldValues) : null,
       newValues ? JSON.stringify(newValues) : null,
       req?.ip, req?.headers?.['user-agent']]
    );
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

module.exports = { authenticateUser, authenticateAdmin, logAudit };
