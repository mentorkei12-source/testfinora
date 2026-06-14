const pool = require('../../config/database');
const { logAudit } = require('../middleware/auth');

// POST /api/user/deposits
const createDeposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;
    const proofImage = req.file ? req.file.filename : null;

    if (!proofImage) return res.status(400).json({ message: 'Payment proof image is required' });
    if (parseFloat(amount) <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const result = await pool.query(
      'INSERT INTO deposits (user_id, amount, proof_image) VALUES ($1, $2, $3) RETURNING *',
      [userId, amount, proofImage]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'info')`,
      [userId, 'Deposit Request Received', `Your deposit of ${amount} FBu is under review. We will notify you once approved.`]
    );

    res.status(201).json({ message: 'Deposit submitted for review', deposit: result.rows[0] });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ message: 'Deposit submission failed' });
  }
};

// GET /api/user/deposits
const getUserDeposits = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch deposits' });
  }
};

// Admin: GET all deposits
const adminGetDeposits = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT d.*, u.full_name, u.username, u.phone FROM deposits d
                 JOIN users u ON d.user_id = u.id`;
    const params = [];
    if (status) { query += ' WHERE d.status = $1'; params.push(status); }
    query += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM deposits${status ? ' WHERE status = $1' : ''}`,
      status ? [status] : []
    );
    res.json({ deposits: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch deposits' });
  }
};

// Admin: PUT approve/reject deposit
const processDeposit = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { action, admin_note } = req.body; // action: 'approve' | 'reject'

    const depositResult = await client.query('SELECT * FROM deposits WHERE id = $1', [id]);
    if (!depositResult.rows[0]) return res.status(404).json({ message: 'Deposit not found' });
    const deposit = depositResult.rows[0];
    if (deposit.status !== 'pending') return res.status(400).json({ message: 'Deposit already processed' });

    await client.query('BEGIN');

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await client.query(
      `UPDATE deposits SET status=$1, admin_note=$2, approved_by=$3, approved_at=NOW(), updated_at=NOW() WHERE id=$4`,
      [newStatus, admin_note, req.admin.id, id]
    );

    if (action === 'approve') {
      // Credit user wallet
      const userResult = await client.query('SELECT wallet_balance FROM users WHERE id = $1', [deposit.user_id]);
      const oldBalance = parseFloat(userResult.rows[0].wallet_balance);
      const newBalance = oldBalance + parseFloat(deposit.amount);

      await client.query('UPDATE users SET wallet_balance = $1 WHERE id = $2', [newBalance, deposit.user_id]);

      // Record transaction
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description, reference_id, reference_type)
         VALUES ($1, 'deposit', $2, $3, $4, 'Deposit approved', $5, 'deposit')`,
        [deposit.user_id, deposit.amount, oldBalance, newBalance, deposit.id]
      );

      // Process referral commissions
      await processReferralCommissions(client, deposit);
    }

    // Notify user
    const msg = action === 'approve'
      ? `Your deposit of ${deposit.amount} FBu has been approved and credited to your wallet.`
      : `Your deposit of ${deposit.amount} FBu was rejected. ${admin_note || ''}`;
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
      [deposit.user_id, `Deposit ${newStatus}`, msg, action === 'approve' ? 'success' : 'error']
    );

    await client.query('COMMIT');
    await logAudit(req.admin.id, `${action.toUpperCase()}_DEPOSIT`, 'deposit', id, { status: 'pending' }, { status: newStatus }, req);
    res.json({ message: `Deposit ${newStatus}` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Process deposit error:', err);
    res.status(500).json({ message: 'Failed to process deposit' });
  } finally {
    client.release();
  }
};

const processReferralCommissions = async (client, deposit) => {
  try {
    const settingsResult = await client.query(
      "SELECT key, value FROM settings WHERE key IN ('referral_level1_rate', 'referral_level2_rate')"
    );
    const settings = {};
    settingsResult.rows.forEach(r => { settings[r.key] = parseFloat(r.value); });
    const level1Rate = settings.referral_level1_rate || 10;
    const level2Rate = settings.referral_level2_rate || 5;

    const referrals = await client.query(
      'SELECT * FROM referrals WHERE referred_id = $1',
      [deposit.user_id]
    );

    for (const referral of referrals.rows) {
      const rate = referral.level === 1 ? level1Rate : level2Rate;
      const commission = (parseFloat(deposit.amount) * rate) / 100;

      const referrerResult = await client.query('SELECT wallet_balance FROM users WHERE id = $1', [referral.referrer_id]);
      const oldBalance = parseFloat(referrerResult.rows[0].wallet_balance);
      const newBalance = oldBalance + commission;

      await client.query('UPDATE users SET wallet_balance = $1, referral_earnings = referral_earnings + $2 WHERE id = $3',
        [newBalance, commission, referral.referrer_id]);

      await client.query(
        `INSERT INTO referral_commissions (referrer_id, referred_id, deposit_id, level, rate, amount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [referral.referrer_id, deposit.user_id, deposit.id, referral.level, rate, commission]
      );

      await client.query(
        `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description)
         VALUES ($1, 'referral_bonus', $2, $3, $4, $5)`,
        [referral.referrer_id, commission, oldBalance, newBalance, `Level ${referral.level} referral commission`]
      );

      await client.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'success')`,
        [referral.referrer_id, 'Referral Commission', `You earned ${commission.toLocaleString()} FBu (Level ${referral.level} commission)`]
      );
    }
  } catch (err) {
    console.error('Referral commission error:', err);
  }
};

module.exports = { createDeposit, getUserDeposits, adminGetDeposits, processDeposit };
