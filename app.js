const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const authRouter = require('./routes/userRouter');

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/api/v1', authRouter);

// sample route
app.get('/', (req, res) => {
    res.json({message: 'Welcome to NovaCore API'});
});

module.exports = app;