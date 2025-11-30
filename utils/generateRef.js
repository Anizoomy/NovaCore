module.exports = function generateRef(prefix = 'NC') {
    return `${prefix}_${Date.now()}_${Math.floor(10000 + Math.random() * 900000)}`
};