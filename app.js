const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const authRouter = require('./routes/userRouter');
const taskRouter = require('./routes/taskRouter');
const walletRouter = require('./routes/walletRouter');
const webhookRouter = require('./routes/webhookRouter');


const app = express();
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(cors());
app.use(morgan('dev'));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1', authRouter);
app.use('/api/v1', taskRouter);
app.use('/api/v1', walletRouter);
app.use('/api/v1', webhookRouter);



// sample route
app.get('/', (req, res) => {
    res.json({message: 'Welcome to NovaCore API'});
});

module.exports = app;