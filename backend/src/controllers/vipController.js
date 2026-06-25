const pool = require('../../config/database');
const { logAudit } = require('../middleware/auth');

// GET /api/vip-plans (public)
const getPlans = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vip_plans WHERE is_active = true ORDER BY sort_order ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch plans' });
  }
};

// POST /api/user/vip/purchase
const purchasePlan = async (req, res) => {
  const client = await pool.connect();
  try {
    const { plan_id } = req.body;
    const userId = req.user.id;

    const planResult = await client.query(
      'SELECT * FROM vip_plans WHERE id = $1 AND is_active = true',
      [plan_id]
    );
    if (!planResult.rows[0]) return res.status(404).json({ message: 'Plan not found' });
    const plan = planResult.rows[0];

    const userResult = await client.query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (parseFloat(user.wallet_balance) < parseFloat(plan.price)) {
      return res.status(400).json({ message: 'Insufficient balance. Please deposit funds first.' });
    }

    await client.query('BEGIN');

    // Deduct from wallet
    const newBalance = parseFloat(user.wallet_balance) - parseFloat(plan.price);
    await client.query('UPDATE users SET wallet_balance = $1 WHERE id = $2', [newBalance, userId]);

    // Deactivate existing plan
    await client.query('UPDATE user_vips SET is_active = false WHERE user_id = $1', [userId]);

    // Create new active plan - fixed 180 days duration
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 180);

    await client.query(
      `INSERT INTO user_vips (user_id, vip_plan_id, purchase_price, daily_profit, end_date)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, plan.id, plan.price, plan.daily_profit, endDate]
    );

    // Record transaction
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description)
       VALUES ($1, 'vip_purchase', $2, $3, $4, $5)`,
      [userId, plan.price, user.wallet_balance, newBalance, `Purchased ${plan.name}`]
    );

    // Notification
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, 'success')`,
      [userId, 'VIP Plan Activated', `Your ${plan.name} plan is now active. You will earn ${plan.daily_profit} FBu daily.`]
    );

    await client.query('COMMIT');
    res.json({ message: `${plan.name} activated successfully!`, new_balance: newBalance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Purchase plan error:', err);
    res.status(500).json({ message: 'Purchase failed' });
  } finally {
    client.release();
  }
};

// Admin: GET all plans
const adminGetPlans = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vip_plans ORDER BY sort_order ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch plans' });
  }
};

// Admin: POST create plan
const createPlan = async (req, res) => {
  try {
    const { name, price, daily_profit, duration_days, description, features, sort_order } = req.body;
    const result = await pool.query(
      `INSERT INTO vip_plans (name, price, daily_profit, duration_days, description, features, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, price, daily_profit, duration_days || 365, description, JSON.stringify(features || []), sort_order || 0]
    );
    await logAudit(req.admin.id, 'CREATE_VIP_PLAN', 'vip_plan', result.rows[0].id, null, result.rows[0], req);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create plan' });
  }
};

// Admin: PUT update plan
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, daily_profit, duration_days, description, features, is_active, sort_order } = req.body;
    const old = await pool.query('SELECT * FROM vip_plans WHERE id = $1', [id]);
    const result = await pool.query(
      `UPDATE vip_plans SET name=$1, price=$2, daily_profit=$3, duration_days=$4,
       description=$5, features=$6, is_active=$7, sort_order=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [name, price, daily_profit, duration_days, description, JSON.stringify(features || []), is_active, sort_order, id]
    );
    await logAudit(req.admin.id, 'UPDATE_VIP_PLAN', 'vip_plan', id, old.rows[0], result.rows[0], req);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update plan' });
  }
};

// Admin: DELETE plan
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM vip_plans WHERE id = $1', [id]);
    await logAudit(req.admin.id, 'DELETE_VIP_PLAN', 'vip_plan', id, null, null, req);
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete plan' });
  }
};

module.exports = { getPlans, purchasePlan, adminGetPlans, createPlan, updatePlan, deletePlan };