const pool = require('../../config/database');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        referral_code VARCHAR(20) UNIQUE NOT NULL,
        referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
        wallet_balance DECIMAL(15,2) DEFAULT 0.00,
        total_earnings DECIMAL(15,2) DEFAULT 0.00,
        referral_earnings DECIMAL(15,2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT TRUE,
        is_banned BOOLEAN DEFAULT FALSE,
        email_verified BOOLEAN DEFAULT FALSE,
        language VARCHAR(10) DEFAULT 'fr',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // VIP Plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vip_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        price DECIMAL(15,2) NOT NULL,
        daily_profit DECIMAL(15,2) NOT NULL,
        duration_days INTEGER DEFAULT 365,
        description TEXT,
        features JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // User VIPs (active plans)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_vips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        vip_plan_id UUID REFERENCES vip_plans(id) ON DELETE CASCADE,
        purchase_price DECIMAL(15,2) NOT NULL,
        daily_profit DECIMAL(15,2) NOT NULL,
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP,
        last_profit_date DATE,
        total_earned DECIMAL(15,2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Deposits table
    await client.query(`
      CREATE TABLE IF NOT EXISTS deposits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        proof_image VARCHAR(500),
        status VARCHAR(20) DEFAULT 'pending',
        admin_note TEXT,
        approved_by UUID REFERENCES admins(id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Withdrawals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        admin_note TEXT,
        processed_by UUID REFERENCES admins(id) ON DELETE SET NULL,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        balance_before DECIMAL(15,2) NOT NULL,
        balance_after DECIMAL(15,2) NOT NULL,
        description TEXT,
        reference_id UUID,
        reference_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Referrals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
        level INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(referrer_id, referred_id)
      );
    `);

    // Referral commissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referral_commissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
        deposit_id UUID REFERENCES deposits(id) ON DELETE CASCADE,
        level INTEGER NOT NULL,
        rate DECIMAL(5,2) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Announcements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Audit logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100),
        entity_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Support messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'open',
        admin_reply TEXT,
        replied_by UUID REFERENCES admins(id) ON DELETE SET NULL,
        replied_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('✅ All tables created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
};

migrate().then(() => process.exit(0)).catch(() => process.exit(1));
