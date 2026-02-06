require('dotenv').config();
require('./utils/redis');
const { default: mongoose } = require('mongoose');
const app = require('./app');
const PORT = process.env.PORT || 3000;
const http = require('http');

const server = http.createServer(app);

mongoose.connect(process.env.MONGODB_URL)
.then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
})
.catch(err => {
    console.log('Error connecting to database', err);
})
