const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../../config/database');

const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const generateToken = (id, type = 'user') => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

// POST /api/auth/register
const register = async (req, res) => {
  const client = await pool.connect();
  try {
    const { full_name, username, phone, password, referral_code } = req.body;

    // Check existing user
    const existing = await client.query(
      'SELECT id FROM users WHERE username = $1 OR phone = $2',
      [username, phone]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Username or phone already exists' });
    }

    // Find referrer
    let referrerId = null;
    let level1ReferrerId = null;
    if (referral_code) {
      const referrer = await client.query('SELECT id, referred_by FROM users WHERE referral_code = $1', [referral_code]);
      if (referrer.rows[0]) {
        referrerId = referrer.rows[0].id;
        level1ReferrerId = referrer.rows[0].referred_by;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const myReferralCode = generateReferralCode();

    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (full_name, username, phone, password, referral_code, referred_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, username, phone, referral_code`,
      [full_name, username, phone, hashedPassword, myReferralCode, referrerId]
    );
    const user = userResult.rows[0];

    // Record referral relationships
    if (referrerId) {
      await client.query(
        'INSERT INTO referrals (referrer_id, referred_id, level) VALUES ($1, $2, 1)',
        [referrerId, user.id]
      );
    }
    if (level1ReferrerId) {
      await client.query(
        'INSERT INTO referrals (referrer_id, referred_id, level) VALUES ($1, $2, 2)',
        [level1ReferrerId, user.id]
      );
    }

    await client.query('COMMIT');

    const token = generateToken(user.id);
    res.status(201).json({ message: 'Registration successful', token, user });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed' });
  } finally {
    client.release();
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const result = await pool.query(
      'SELECT * FROM users WHERE phone = $1 OR username = $1',
      [identifier]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.is_banned) return res.status(403).json({ message: 'Account suspended. Contact support.' });

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

// POST /api/auth/admin/login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!admin.is_active) return res.status(403).json({ message: 'Admin account inactive' });

    await pool.query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]);

    const token = generateToken(admin.id, 'admin');
    const { password: _, ...adminWithoutPassword } = admin;
    res.json({ token, admin: adminWithoutPassword });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, 
        (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id AND level = 1) as level1_count,
        (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id AND level = 2) as level2_count,
        (SELECT vp.name FROM user_vips uv JOIN vip_plans vp ON uv.vip_plan_id = vp.id WHERE uv.user_id = u.id AND uv.is_active = true LIMIT 1) as active_plan
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );
    const { password: _, ...user } = result.rows[0];
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

module.exports = { register, login, adminLogin, getMe };