const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateUser } = require('../middleware/auth');
const { purchasePlan } = require('../controllers/vipController');
const { createDeposit, getUserDeposits } = require('../controllers/depositController');
const { createWithdrawal, getUserWithdrawals } = require('../controllers/withdrawalController');
const { getUserNotifications, markNotificationRead } = require('../controllers/settingsController');
const pool = require('../../config/database');

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || 'uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

router.use(authenticateUser);

// VIP
router.post('/vip/purchase', purchasePlan);
router.get('/vip/active', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT uv.*, vp.name, vp.price FROM user_vips uv
       JOIN vip_plans vp ON uv.vip_plan_id = vp.id
       WHERE uv.user_id = $1 ORDER BY uv.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: 'Failed to fetch VIP info' }); }
});

// Deposits
router.post('/deposits', upload.single('proof'), createDeposit);
router.get('/deposits', getUserDeposits);

// Withdrawals
router.post('/withdrawals', createWithdrawal);
router.get('/withdrawals', getUserWithdrawals);

// Transactions
router.get('/transactions', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: 'Failed to fetch transactions' }); }
});

// Referrals
router.get('/referrals', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.level, u.full_name, u.username, u.created_at,
        (SELECT COALESCE(SUM(rc.amount), 0) FROM referral_commissions rc WHERE rc.referred_id = u.id AND rc.referrer_id = $1) as earned
       FROM referrals r JOIN users u ON r.referred_id = u.id WHERE r.referrer_id = $1 ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: 'Failed to fetch referrals' }); }
});

// Notifications
router.get('/notifications', getUserNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// Dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const [userResult, vipResult, earningsResult, referralStats] = await Promise.all([
      pool.query('SELECT wallet_balance, total_earnings, referral_earnings FROM users WHERE id = $1', [userId]),
      pool.query(`SELECT uv.*, vp.name, vp.daily_profit as plan_daily_profit FROM user_vips uv JOIN vip_plans vp ON uv.vip_plan_id = vp.id WHERE uv.user_id = $1 AND uv.is_active = true LIMIT 1`, [userId]),
      pool.query(`SELECT COALESCE(SUM(amount), 0) as today_earnings FROM transactions WHERE user_id = $1 AND type = 'daily_profit' AND DATE(created_at) = CURRENT_DATE`, [userId]),
      pool.query(`SELECT COUNT(*) FILTER (WHERE level = 1) as level1, COUNT(*) FILTER (WHERE level = 2) as level2 FROM referrals WHERE referrer_id = $1`, [userId]),
    ]);

    res.json({
      wallet_balance: userResult.rows[0]?.wallet_balance || 0,
      total_earnings: userResult.rows[0]?.total_earnings || 0,
      referral_earnings: userResult.rows[0]?.referral_earnings || 0,
      today_earnings: earningsResult.rows[0]?.today_earnings || 0,
      active_vip: vipResult.rows[0] || null,
      referral_level1: referralStats.rows[0]?.level1 || 0,
      referral_level2: referralStats.rows[0]?.level2 || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch dashboard' });
  }
});

module.exports = router;
