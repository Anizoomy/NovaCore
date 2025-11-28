const Task = require('../models/taskModel');

exports.createTask = async (req, res) => {
    try {
        const { title, description, dueDate } = req.body

        if (!title) {
            return res.status(400).json({
                message: 'Title is required'
            });
        }

        const task = await Task.create({
            title,
            description,
            dueDate,
            user: req.user._id
        });

        res.status(201).json({
            message: 'Task created successfully',
            task
        })

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        })
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { title, description, dueDate, completed } = req.body;

        const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

        if (!task) {
            return res.status(404).json({
                message: 'Task not found'
            });
        }

        if (title) task.title = title;
        if (description) task.description = description;
        if (dueDate) task.dueDate = dueDate;
        if (completed !== undefined) task.completed = completed;

        await task.save();

        res.status(200).json({
            message: 'Task updated successfully',
            task
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error'
        })
    }
};

exports.deleteTask = async (req, res) => {
    try {
        let task;
        // allow superadmin to delete any task
        if (req.user.role === 'superadmin') {
            task = await Task.findOneAndDelete({ _id: req.params.id });
        } else {
            task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        }

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Sever error',
            error: error.message
        });
    }
};

exports.getTasks = async (req, res) => {
    try {
        let tasks;
        // superadmin can view all users' tasks
        if (req.user.role === 'superadmin') {
            tasks = await Task.find({}).sort({ dueDate: 1 }).populate('user', 'name email');
        } else {
            tasks = await Task.find({ user: req.user._id }).sort({ dueDate: 1 });
        }

        res.status(200).json({ message: 'Tasks retrieved successfully', tasks });
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};