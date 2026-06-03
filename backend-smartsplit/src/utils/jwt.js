const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'cheie-secreta-super-lunga-si-sigura-123';

const generateToken = (user) => {
    return jwt.sign(
        { 
            sub: user.id,
            role: user.role
        }, 
        SECRET,
        { expiresIn: '24h' }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = { generateToken, verifyToken };