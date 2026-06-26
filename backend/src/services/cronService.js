const cron = require('node-cron');
const pool = require('../../config/database');

const processDailyProfits = async () => {
  const client = await pool.connect();
  console.log('⏰ Running daily profit processing...');
  try {
    const activeVips = await client.query(`
      SELECT uv.*, u.wallet_balance, u.id as uid
      FROM user_vips uv
      JOIN users u ON uv.user_id = u.id
      WHERE uv.is_active = true
        AND u.is_active = true
        AND u.is_banned = false
        AND (uv.last_profit_date IS NULL OR uv.last_profit_date < CURRENT_DATE)
        AND (uv.end_date IS NULL OR uv.end_date > NOW())
    `);

    console.log(`📊 Processing ${activeVips.rows.length} active VIP users`);

    let processed = 0;
    for (const vip of activeVips.rows) {
      try {
        await client.query('BEGIN');

        const profitAmount = parseFloat(vip.daily_profit);
        const oldBalance = parseFloat(vip.wallet_balance);
        const newBalance = oldBalance + profitAmount;

        // Update user wallet
        await client.query(
          'UPDATE users SET wallet_balance = $1, total_earnings = total_earnings + $2 WHERE id = $3',
          [newBalance, profitAmount, vip.user_id]
        );

        // Update last profit date
        await client.query(
          'UPDATE user_vips SET last_profit_date = CURRENT_DATE, total_earned = total_earned + $1 WHERE id = $2',
          [profitAmount, vip.id]
        );

        // Record transaction
        await client.query(
          `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description, reference_id, reference_type)
           VALUES ($1, 'daily_profit', $2, $3, $4, 'Daily VIP profit', $5, 'user_vip')`,
          [vip.user_id, profitAmount, oldBalance, newBalance, vip.id]
        );

        // Notification once per week (Monday)
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 1) {
          await client.query(
            `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'success')`,
            [vip.user_id, 'Daily Earnings', `You earned ${profitAmount.toLocaleString()} FBu today from your VIP plan.`]
          );
        }

        await client.query('COMMIT');
        processed++;
      } catch (userErr) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed to process profit for user ${vip.user_id}:`, userErr);
      }
    }

    console.log(`✅ Daily profits processed for ${processed}/${activeVips.rows.length} users`);
  } catch (err) {
    console.error('❌ Daily profit processing failed:', err);
  } finally {
    client.release();
  }
};

const startCronJobs = () => {
  // Run daily at midnight Bujumbura time
  cron.schedule('0 0 * * *', processDailyProfits, {
    scheduled: true,
    timezone: 'Africa/Bujumbura'
  });

  // Run at startup in ALL environments to catch any missed profits
  setTimeout(processDailyProfits, 5000);

  console.log('✅ Cron jobs scheduled');
};

module.exports = { startCronJobs, processDailyProfits };