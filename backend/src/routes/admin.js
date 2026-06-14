const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const { adminGetPlans, createPlan, updatePlan, deletePlan } = require('../controllers/vipController');
const { adminGetDeposits, processDeposit } = require('../controllers/depositController');
const { adminGetWithdrawals, processWithdrawal } = require('../controllers/withdrawalController');
const { getUsers, getUser, updateUser, adjustBalance, resetUserPassword, getDashboardStats } = require('../controllers/adminController');
const { getAllSettings, updateSettings, createAnnouncement, updateAnnouncement, deleteAnnouncement, getAuditLogs } = require('../controllers/settingsController');

router.use(authenticateAdmin);

// Dashboard stats
router.get('/stats', getDashboardStats);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.post('/users/:id/adjust-balance', adjustBalance);
router.post('/users/:id/reset-password', resetUserPassword);

// VIP Plans
router.get('/vip-plans', adminGetPlans);
router.post('/vip-plans', createPlan);
router.put('/vip-plans/:id', updatePlan);
router.delete('/vip-plans/:id', deletePlan);

// Deposits
router.get('/deposits', adminGetDeposits);
router.put('/deposits/:id', processDeposit);

// Withdrawals
router.get('/withdrawals', adminGetWithdrawals);
router.put('/withdrawals/:id', processWithdrawal);

// Settings
router.get('/settings', getAllSettings);
router.put('/settings', updateSettings);

// Announcements
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// Audit logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;
