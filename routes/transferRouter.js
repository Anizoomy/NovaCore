const express = require('express');
const router = express.Router();
const { getBanks, verifyAccount, initiateTransfer } = require('../controllers/transferController');
const { secure } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Transfer
 *   description: Transfer operations
 */

/**
 * @swagger
 * /api/v1/banks:
 *   get:
 *     summary: Get list of supported banks
 *     tags: [Transfer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of banks fetched
 */
router.get('/banks', secure, getBanks);

/**
 * @swagger
 * /api/v1/resolve-account:
 *   post:
 *     summary: Verify account number
 *     tags: [Transfer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: "0123456789"
 *               bankCode:
 *                 type: string
 *                 example: "058"
 *     responses:
 *       200:
 *         description: Account successfully resolved
 */
router.post('/verify-account', secure, verifyAccount);

/**
 * @swagger
* /api/v1/send-money:
 *   post:
 *     summary: Initiate a payout/transfer
 *     tags: [Transfer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500
 *               bankCode:
 *                 type: string
 *                 example: "058"
 *               accountNumber:
 *                 type: string
 *                 example: "0123456789"
 *               accountName:
 *                 type: string
 *                 example: "KORAPAY TEST USER"
 *               narration:
 *                 type: string
 *                 example: "Payment for dinner"
 *     responses:
 *       200:
 *         description: Transfer initiated
 */
router.post('/send-money', secure, initiateTransfer);

module.exports = router;