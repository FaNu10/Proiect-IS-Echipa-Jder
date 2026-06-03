const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const pool = require('../db');
const { notifyAdmins } = require('../utils/notifyAdmins');

const register = async (name, email, password) => {
    const existing = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
        throw new Error('EMAIL_TAKEN');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
        'INSERT INTO "User" (id, name, email, password, role, "createdAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW()) RETURNING id, name, email, role, "createdAt"',
        [name, email, hashedPassword, 'member']
    );

    const newUser = result.rows[0];
    // Notify all admins about the new registration (fire-and-forget)
    notifyAdmins('NEW_USER', newUser.id, null);
    return newUser;
};

const login = async (email, password) => {
    const result = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (result.rows.length === 0) {
        throw new Error('INVALID_CREDENTIALS');
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        throw new Error('INVALID_CREDENTIALS');
    }

    const token = generateToken(user);

    return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
    };
};

module.exports = { register, login };
