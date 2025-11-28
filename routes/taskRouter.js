const express = require('express');
const router = express.Router();

const { secure } = require('../middleware/authMiddleware');
const { createTask, updateTask, deleteTask, getTasks } = require('../controllers/taskController');

router.post('/tasks', secure, createTask);

router.put('/tasks/:id', secure, updateTask);

router.delete('/tasks/:id', secure, deleteTask);

router.get('/tasks', secure, getTasks);










module.exports = router;




