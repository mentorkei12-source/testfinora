const pool = require('../../config/database');
const { logAudit } = require('../middleware/auth');

// POST /api/user/withdrawals
const createWithdrawal = async (req, res) => {
  const client = await pool.connect();
  try {
    const { amount, phone_number } = req.body;
    const userId = req.user.id;

    // Get settings
    const settingsResult = await client.query(
      "SELECT key, value FROM settings WHERE key IN ('min_withdrawal', 'max_withdrawal')"
    );
    const settings = {};
    settingsResult.rows.forEach(r => { settings[r.key] = parseFloat(r.value); });

    if (parseFloat(amount) < (settings.min_withdrawal || 10000))
      return res.status(400).json({ message: `Minimum withdrawal is ${settings.min_withdrawal || 10000} FBu` });

    if (parseFloat(amount) > (settings.max_withdrawal || 5000000))
      return res.status(400).json({ message: `Maximum withdrawal is ${settings.max_withdrawal || 5000000} FBu` });

    const userResult = await client.query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
    if (parseFloat(userResult.rows[0].wallet_balance) < parseFloat(amount))
      return res.status(400).json({ message: 'Insufficient balance' });

    // Check pending withdrawal
    const pendingResult = await client.query(
      "SELECT id FROM withdrawals WHERE user_id = $1 AND status = 'pending'",
      [userId]
    );
    if (pendingResult.rows.length > 0)
      return res.status(400).json({ message: 'You already have a pending withdrawal request' });

    await client.query('BEGIN');

    // Hold funds
    await client.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [amount, userId]);

    const result = await client.query(
      'INSERT INTO withdrawals (user_id, amount, phone_number) VALUES ($1, $2, $3) RETURNING *',
      [userId, amount, phone_number]
    );

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description)
       VALUES ($1, 'withdrawal', $2, $3, $4, 'Withdrawal request submitted')`,
      [userId, amount, userResult.rows[0].wallet_balance, parseFloat(userResult.rows[0].wallet_balance) - parseFloat(amount)]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'info')`,
      [userId, 'Withdrawal Request Submitted', `Your withdrawal of ${amount} FBu is being processed.`]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Withdrawal request submitted', withdrawal: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Withdrawal error:', err);
    res.status(500).json({ message: 'Withdrawal request failed' });
  } finally {
    client.release();
  }
};

// GET /api/user/withdrawals
const getUserWithdrawals = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch withdrawals' });
  }
};

// Admin: GET all withdrawals
const adminGetWithdrawals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT w.*, u.full_name, u.username, u.phone FROM withdrawals w
                 JOIN users u ON w.user_id = u.id`;
    const params = [];
    if (status) { query += ' WHERE w.status = $1'; params.push(status); }
    query += ` ORDER BY w.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    const countResult = await pool.query(`SELECT COUNT(*) FROM withdrawals${status ? ' WHERE status=$1' : ''}`, status ? [status] : []);
    res.json({ withdrawals: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch withdrawals' });
  }
};

// Admin: PUT process withdrawal
const processWithdrawal = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { action, admin_note } = req.body; // approve | complete | reject

    const withdrawalResult = await client.query('SELECT * FROM withdrawals WHERE id = $1', [id]);
    if (!withdrawalResult.rows[0]) return res.status(404).json({ message: 'Withdrawal not found' });
    const withdrawal = withdrawalResult.rows[0];

    await client.query('BEGIN');

    let newStatus;
    if (action === 'approve') newStatus = 'approved';
    else if (action === 'complete') newStatus = 'completed';
    else if (action === 'reject') {
      newStatus = 'rejected';
      // Refund
      await client.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [withdrawal.amount, withdrawal.user_id]);
    }

    await client.query(
      `UPDATE withdrawals SET status=$1, admin_note=$2, processed_by=$3, processed_at=NOW(), updated_at=NOW() WHERE id=$4`,
      [newStatus, admin_note, req.admin.id, id]
    );

    const msg = action === 'reject'
      ? `Your withdrawal of ${withdrawal.amount} FBu was rejected and refunded. ${admin_note || ''}`
      : `Your withdrawal of ${withdrawal.amount} FBu is ${newStatus}.`;

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
      [withdrawal.user_id, `Withdrawal ${newStatus}`, msg, action === 'reject' ? 'error' : 'success']
    );

    await client.query('COMMIT');
    await logAudit(req.admin.id, `${action.toUpperCase()}_WITHDRAWAL`, 'withdrawal', id, { status: withdrawal.status }, { status: newStatus }, req);
    res.json({ message: `Withdrawal ${newStatus}` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to process withdrawal' });
  } finally {
    client.release();
  }
};

module.exports = { createWithdrawal, getUserWithdrawals, adminGetWithdrawals, processWithdrawal };
