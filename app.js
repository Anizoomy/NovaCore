const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const authRouter = require('./routes/userRouter');
const taskRouter = require('./routes/taskRouter');

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/api/v1', authRouter);
app.use('/api/v1', taskRouter);

// sample route
app.get('/', (req, res) => {
    res.json({message: 'Welcome to NovaCore API'});
});

module.exports = app;