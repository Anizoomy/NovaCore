const express = require('express');
const router = express.Router();
const { getBanks, verifyAccount, initiateTransfer } = require('../controllers/transferController');
const { secure } = require('../middleware/authMiddleware');



/**
 * @swagger
 * /banks:
 *   get:
 *     tags:
 *       - Transfer
 *     summary: Get supported banks
 *     description: Retrieve the list of banks supported for transfer operations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Banks fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 banks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: GTBank
 *                       code:
 *                         type: string
 *                         example: "058"
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
 *     summary: Verify bank account details
 *     description: Validates recipient bank account details before initiating a transfer operation
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
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 accountName:
 *                   type: string
 *                   example: JOHN DOE
 *                 accountNumber:
 *                   type: string
 *                   example: "0123456789"
 *                 bankName:
 *                   type: string
 *                   example: GTBank
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
 *     summary: Send money to bank account
 *     description: Initiates a transfer operation to a verified bank account
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
 *                 example: Transfer for services
 *     responses:
 *       200:
 *         description: Transfer initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 reference:
 *                   type: string
 *                   example: TRX_123456789
 *                 amount:
 *                   type: number
 *                   example: 5000
 *       400:
 *         description: Transfer failed
 *       401:
 *         description: Unauthorized
 */
router.post('/send-money', secure, initiateTransfer);

module.exports = router;