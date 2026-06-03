const { verifyToken } = require('../utils/jwt');

const protect = (req, res, next) => {
    let token;

    // Un token JWT se trimite standard în Headers, la "Authorization" sub forma: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extragem doar token-ul propriu-zis (ștergem cuvântul "Bearer ")
            token = req.headers.authorization.split(' ')[1];

            // Verificăm dacă token-ul este valid folosind unealta făcută de noi
            const decoded = verifyToken(token);

            if (!decoded) {
                return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token invalid sau expirat!' });
            }

            // Atașăm datele utilizatorului din token direct de cerere (req.user) pentru a le folosi în următorul pas
            req.user = { id: decoded.sub, role: decoded.role };

            // Totul e brici, lasă cererea să meargă mai departe la controller!
            return next();
        } catch (error) {
            return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Nu esti autorizat!' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Lipsește token-ul de autentificare!' });
    }
};

module.exports = { protect };