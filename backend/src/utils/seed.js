const pool = require('../../config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed admin
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@1111', 12);
    await client.query(`
      INSERT INTO admins (name, email, password, role)
      VALUES ('Super Admin', $1, $2, 'superadmin')
      ON CONFLICT (email) DO NOTHING
    `, [process.env.ADMIN_EMAIL || 'admin@finora.com', hashedPassword]);

    // Seed VIP plans only if they don't exist yet (never delete existing plans)
    const vipPlans = [
      { name: 'VIP 1', price: 50000, daily_profit: 2000, duration_days: 180, sort_order: 1 },
      { name: 'VIP 2', price: 100000, daily_profit: 3500, duration_days: 180, sort_order: 2 },
      { name: 'VIP 3', price: 200000, daily_profit: 10000, duration_days: 180, sort_order: 3 },
      { name: 'VIP 4', price: 400000, daily_profit: 15000, duration_days: 180, sort_order: 4 },
    ];

    for (const plan of vipPlans) {
      await client.query(`
        INSERT INTO vip_plans (name, price, daily_profit, duration_days, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name) DO NOTHING
      `, [plan.name, plan.price, plan.daily_profit, plan.duration_days, plan.sort_order]);
    }

    // Seed default settings
    const defaultSettings = [
      ['site_name', 'Finora FX'],
      ['site_tagline', "Burundi's Premier Investment Platform"],
      ['currency', 'FBu'],
      ['whatsapp_group_link', 'https://chat.whatsapp.com/your-group-link'],
      ['whatsapp_support_number', '+257XXXXXXXX'],
      ['referral_level1_rate', '10'],
      ['referral_level2_rate', '5'],
      ['min_withdrawal', '10000'],
      ['max_withdrawal', '5000000'],
      ['deposit_instructions', 'Envoyez votre dépôt au numéro mobile money suivant et uploadez la preuve de paiement.'],
      ['deposit_phone', '+257XXXXXXXX'],
      ['maintenance_mode', 'false'],
    ];

    for (const [key, value] of defaultSettings) {
      await client.query(`
        INSERT INTO settings (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO NOTHING
      `, [key, value]);
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
  }
};

seed().then(() => process.exit(0)).catch(() => process.exit(1));