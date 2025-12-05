const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const authRouter = require('./routes/userRouter');
const taskRouter = require('./routes/taskRouter');
const walletRouter = require('./routes/walletRouter');
const webhookRouter = require('./routes/webhookRouter');


const app = express();
// app.use('/api/v1/webhook', express.raw({ type: '*/*' }));
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/api/v1', authRouter);
app.use('/api/v1', taskRouter);
app.use('/api/v1', walletRouter);
app.use('/api/v1/webhook', webhookRouter);

// sample route
app.get('/', (req, res) => {
    res.json({message: 'Welcome to NovaCore API'});
});

module.exports = app;