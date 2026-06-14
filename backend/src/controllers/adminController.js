const pool = require('../../config/database');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../middleware/auth');

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    let params = [];
    let where = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(`(u.full_name ILIKE $${params.length} OR u.username ILIKE $${params.length} OR u.phone ILIKE $${params.length})`);
    }
    if (status === 'banned') where.push('u.is_banned = true');
    if (status === 'active') where.push('u.is_active = true AND u.is_banned = false');

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT u.*, 
        (SELECT vp.name FROM user_vips uv JOIN vip_plans vp ON uv.vip_plan_id = vp.id WHERE uv.user_id = u.id AND uv.is_active = true LIMIT 1) as active_plan,
        (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id) as referral_count
       FROM users u ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await pool.query(`SELECT COUNT(*) FROM users u ${whereClause}`, params.slice(0, -2));
    res.json({ users: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// GET /api/admin/users/:id
const getUser = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*,
        (SELECT json_agg(row_to_json(uv)) FROM user_vips uv WHERE uv.user_id = u.id) as vip_history
       FROM users u WHERE u.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'User not found' });
    const { password: _, ...user } = result.rows[0];
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, is_active, is_banned } = req.body;
    const old = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const result = await pool.query(
      'UPDATE users SET full_name=$1, phone=$2, is_active=$3, is_banned=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
      [full_name, phone, is_active, is_banned, id]
    );
    await logAudit(req.admin.id, 'UPDATE_USER', 'user', id, old.rows[0], result.rows[0], req);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// POST /api/admin/users/:id/adjust-balance
const adjustBalance = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { amount, type, description } = req.body; // type: 'credit' | 'debit'
    const userResult = await client.query('SELECT wallet_balance FROM users WHERE id = $1', [id]);
    if (!userResult.rows[0]) return res.status(404).json({ message: 'User not found' });

    const oldBalance = parseFloat(userResult.rows[0].wallet_balance);
    const adjustment = type === 'credit' ? Math.abs(amount) : -Math.abs(amount);
    const newBalance = oldBalance + adjustment;

    if (newBalance < 0) return res.status(400).json({ message: 'Insufficient balance for debit' });

    await client.query('BEGIN');
    await client.query('UPDATE users SET wallet_balance = $1 WHERE id = $2', [newBalance, id]);
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description)
       VALUES ($1, 'admin_adjustment', $2, $3, $4, $5)`,
      [id, Math.abs(amount), oldBalance, newBalance, description || `Admin ${type} adjustment`]
    );
    await client.query('COMMIT');

    await logAudit(req.admin.id, 'ADJUST_BALANCE', 'user', id, { balance: oldBalance }, { balance: newBalance }, req);
    res.json({ message: 'Balance adjusted', new_balance: newBalance });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to adjust balance' });
  } finally {
    client.release();
  }
};

// POST /api/admin/users/:id/reset-password
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    const hashed = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, id]);
    await logAudit(req.admin.id, 'RESET_USER_PASSWORD', 'user', id, null, null, req);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_active = true AND is_banned = false) as active_users,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE) as new_users_today,
        (SELECT COALESCE(SUM(amount), 0) FROM deposits WHERE status = 'approved') as total_deposits,
        (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status = 'completed') as total_withdrawals,
        (SELECT COUNT(*) FROM deposits WHERE status = 'pending') as pending_deposits,
        (SELECT COUNT(*) FROM withdrawals WHERE status = 'pending') as pending_withdrawals,
        (SELECT COUNT(*) FROM user_vips WHERE is_active = true) as active_vip_users,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'daily_profit' AND DATE(created_at) = CURRENT_DATE) as today_profits
    `);
    res.json(stats.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

module.exports = { getUsers, getUser, updateUser, adjustBalance, resetUserPassword, getDashboardStats };
