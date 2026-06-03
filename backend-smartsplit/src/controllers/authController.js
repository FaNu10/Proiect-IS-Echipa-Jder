const authService = require('../services/authService');

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'BAD_REQUEST', message: 'Toate campurile sunt obligatorii!' });
        }

        const user = await authService.register(name, email, password);
        return res.status(201).json(user);
    } catch (error) {
        if (error.message === 'EMAIL_TAKEN') {
            return res.status(409).json({ error: 'CONFLICT', message: 'Email-ul este deja inregistrat.' });
        }
        return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'BAD_REQUEST', message: 'Email-ul si parola sunt obligatorii!' });
        }

        const data = await authService.login(email, password);
        return res.status(200).json(data);
    } catch (error) {
        if (error.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Date de autentificare invalide.' });
        }
        return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
};

module.exports = { register, login };