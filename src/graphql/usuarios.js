import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLID,
    GraphQLList,
    GraphQLNonNull
} from 'graphql';

import { connectDB } from '../config/db.js';

// Tipo de usuario
const UsuarioType = new GraphQLObjectType({
    name: 'Usuario',
    fields: {
        id: {
            type: GraphQLID,
            resolve: usuario => usuario._id.toString()
        },
        nombre: { type: GraphQLString },
        email: { type: GraphQLString }
    }
});

// Consultas
export const usuariosQuery = {
    usuarios: {
        type: new GraphQLList(UsuarioType),
        async resolve() {
            const db = await connectDB();

            return db.collection('usuarios')
                .find({}, { projection: { password: 0 } })
                .toArray();
        }
    }
};

// Operaciones de modificación
export const usuariosMutation = {
    registrarUsuario: {
        type: UsuarioType,
        args: {
            nombre: { type: new GraphQLNonNull(GraphQLString) },
            email: { type: new GraphQLNonNull(GraphQLString) },
            password: { type: new GraphQLNonNull(GraphQLString) }
        },
        async resolve(_, args) {
            const db = await connectDB();
            const usuarios = db.collection('usuarios');

            const nombre = args.nombre.trim();
            const email = args.email.trim().toLowerCase();

            if (!nombre || !email || !args.password.trim()) {
                throw new Error('Todos los campos son obligatorios');
            }

            const usuarioExistente = await usuarios.findOne({ email });

            if (usuarioExistente) {
                throw new Error('Ya existe un usuario con ese email');
            }

            // Pendiente de integrar el cifrado de Persona 2.
            throw new Error('Registro pendiente de integrar con auth.js');
        }
    }
};
