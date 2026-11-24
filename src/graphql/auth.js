
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Generar token
export function generarToken(usuario) {
    if (!JWT_SECRET) {
        throw new Error('Falta configurar JWT_SECRET');
    }

    return jwt.sign(
        {
            id: usuario._id.toString(),
            email: usuario.email,
            rol: usuario.rol || 'particular'
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

// Verificar token
export function verificarToken(token) {
    if (!JWT_SECRET) {
        throw new Error('Falta configurar JWT_SECRET');
    }

    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        throw new Error('Token inválido o caducado');
    }
}

// Comprobar que el usuario ha iniciado sesión
export function requiereAutenticacion(context) {
    if (!context.usuario) {
        throw new Error('Debes iniciar sesión para realizar esta acción');
    }

    return context.usuario;
}

// Comprobar permisos de administrador
export function requiereAdmin(context) {
    const usuario = requiereAutenticacion(context);

    if (usuario.rol !== 'admin') {
        throw new Error('No tienes permisos de administrador');
    }

    return usuario;
}
