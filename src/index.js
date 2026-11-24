import express from 'express';
import { createHandler } from 'graphql-http/lib/use/express';
import schema from './graphql/schema.js';
import { connectDB } from './config/db.js';
import { verificarToken } from './graphql/auth.js';

const app = express();

app.use(express.json());

app.all('/graphql', createHandler({
    schema,
    context: (req) => {
        const authorization = req.headers.authorization;

        let usuario = null;

        if (authorization && authorization.startsWith('Bearer ')) {
            try {
                usuario = verificarToken(authorization.substring(7));
            } catch {
                usuario = null;
            }
        }

        return { usuario };
    }
}));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en http://localhost:${PORT}/graphql`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

startServer();
