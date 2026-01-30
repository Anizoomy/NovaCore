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
 * /banks:
 *   get:
 *     tags:
 *       - Transfer
 *     summary: Get list of supported banks
 *     description: Fetches all supported banks for transfers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Banks retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               banks:
 *                 - name: Access Bank
 *                   code: "044"
 *                 - name: GTBank
 *                   code: "058"
 *                 - name: First Bank
 *                   code: "011"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/banks', secure, getBanks);

/**
 * @swagger
 * /verify-account:
 *   post:
 *     tags:
 *       - Transfer
 *     summary: Verify recipient bank account
 *     description: Verifies a bank account number and bank code before initiating a transfer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - bankCode
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: "0123456789"
 *               bankCode:
 *                 type: string
 *                 example: "058"
 *     responses:
 *       200:
 *         description: Account verified successfully
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               accountName: JOHN DOE
 *               accountNumber: "0123456789"
 *               bankName: GTBank
 *       400:
 *         description: Invalid account details
 *       401:
 *         description: Unauthorized
 */
router.post('/verify-account', secure, verifyAccount);

/**
 * @swagger
 * /send-money:
 *   post:
 *     tags:
 *       - Transfer
 *     summary: Send money to a bank account
 *     description: Initiates a bank transfer after successful account verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - accountNumber
 *               - bankCode
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *               accountNumber:
 *                 type: string
 *                 example: "0123456789"
 *               bankCode:
 *                 type: string
 *                 example: "058"
 *               narration:
 *                 type: string
 *                 example: Payment for services
 *     responses:
 *       200:
 *         description: Transfer initiated successfully
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               reference: TRX_123456789
 *               amount: 5000
 *       400:
 *         description: Transfer failed
 *       401:
 *         description: Unauthorized
 */
router.post('/send-money', secure, initiateTransfer);

module.exports = router;