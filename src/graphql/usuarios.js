import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLID,
    GraphQLList,
    GraphQLNonNull
} from 'graphql';

import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { connectDB } from '../config/db.js';
import { generarToken } from './auth.js';

// Tipo de usuario
const UsuarioType = new GraphQLObjectType({
    name: 'Usuario',
    fields: {
        id: {
            type: GraphQLID,
            resolve: usuario => usuario._id.toString()
        },
        nombre: { type: GraphQLString },
        email: { type: GraphQLString },
        rol: { type: GraphQLString }
    }
});

// Consultas
export const usuariosQuery = {
    usuarios: {
        type: new GraphQLList(UsuarioType),
        async resolve(_, args, context) {
            if (!context.usuario || context.usuario.rol !== 'admin') {
                throw new Error('Solo los administradores pueden consultar todos los usuarios');
            }

            const db = await connectDB();

            return db.collection('usuarios')
                .find({}, { projection: { password: 0 } })
                .toArray();
        }
    }
};

// Modificaciones
export const usuariosMutation = {

    // Registro
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
            const password = args.password;

            if (!nombre || !email || !password.trim()) {
                throw new Error('Todos los campos son obligatorios');
            }

            if (password.length < 8) {
                throw new Error('La contraseña debe tener al menos 8 caracteres');
            }

            if (await usuarios.findOne({ email })) {
                throw new Error('Ya existe un usuario con ese email');
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const nuevoUsuario = {
                nombre,
                email,
                password: passwordHash,
                rol: 'particular'
            };

            const resultado = await usuarios.insertOne(nuevoUsuario);

            return {
                _id: resultado.insertedId,
                nombre,
                email,
                rol: 'particular'
            };
        }
    },

    // Inicio de sesión
    loginUsuario: {
        type: GraphQLString,
        args: {
            email: { type: new GraphQLNonNull(GraphQLString) },
            password: { type: new GraphQLNonNull(GraphQLString) }
        },
        async resolve(_, args) {
            const db = await connectDB();

            const email = args.email.trim().toLowerCase();

            const usuario = await db.collection('usuarios').findOne({ email });

            if (!usuario) {
                throw new Error('Email o contraseña incorrectos');
            }

            const passwordCorrecta = await bcrypt.compare(
                args.password,
                usuario.password
            );

            if (!passwordCorrecta) {
                throw new Error('Email o contraseña incorrectos');
            }

            return generarToken(usuario);
        }
    },

    // Actualizar usuario
    actualizarUsuario: {
        type: UsuarioType,
        args: {
            id: { type: new GraphQLNonNull(GraphQLID) },
            nombre: { type: GraphQLString },
            email: { type: GraphQLString },
            password: { type: GraphQLString }
        },
        async resolve(_, args, context) {
            if (!context.usuario || context.usuario.rol !== 'admin') {
                throw new Error('Solo los administradores pueden modificar usuarios');
            }

            if (!ObjectId.isValid(args.id)) {
                throw new Error('ID no válido');
            }

            const db = await connectDB();
            const usuarios = db.collection('usuarios');
            const id = new ObjectId(args.id);

            const usuario = await usuarios.findOne({ _id: id });

            if (!usuario) {
                throw new Error('Usuario no encontrado');
            }

            const cambios = {};

            if (args.nombre !== undefined) {
                if (!args.nombre.trim()) throw new Error('Nombre no válido');
                cambios.nombre = args.nombre.trim();
            }

            if (args.email !== undefined) {
                const email = args.email.trim().toLowerCase();

                if (!email) throw new Error('Email no válido');

                const existente = await usuarios.findOne({
                    email,
                    _id: { $ne: id }
                });

                if (existente) throw new Error('Email ya registrado');

                cambios.email = email;
            }

            if (args.password !== undefined) {
                if (args.password.length < 8) {
                    throw new Error('La contraseña debe tener al menos 8 caracteres');
                }

                cambios.password = await bcrypt.hash(args.password, 10);
            }

            if (Object.keys(cambios).length === 0) {
                throw new Error('No has indicado ningún dato para modificar');
            }

            await usuarios.updateOne({ _id: id }, { $set: cambios });

            return usuarios.findOne(
                { _id: id },
                { projection: { password: 0 } }
            );
        }
    },


    // Cambiar rol de usuario (solo administrador)
    cambiarRolUsuario: {
        type: UsuarioType,
        args: {
            id: { type: new GraphQLNonNull(GraphQLID) },
            rol: { type: new GraphQLNonNull(GraphQLString) }
        },
        async resolve(_, args, context) {
            if (!context.usuario || context.usuario.rol !== 'admin') {
                throw new Error('Solo los administradores pueden cambiar roles');
            }

            const rolesPermitidos = ['particular', 'tecnico', 'admin'];

            if (!rolesPermitidos.includes(args.rol)) {
                throw new Error('Rol no válido');
            }

            if (!ObjectId.isValid(args.id)) {
                throw new Error('ID no válido');
            }

            const db = await connectDB();
            const id = new ObjectId(args.id);

            const resultado = await db.collection('usuarios').updateOne(
                { _id: id },
                { $set: { rol: args.rol } }
            );

            if (resultado.matchedCount === 0) {
                throw new Error('Usuario no encontrado');
            }

            return db.collection('usuarios').findOne(
                { _id: id },
                { projection: { password: 0 } }
            );
        }
    },


    // Eliminar usuario
    eliminarUsuario: {
        type: GraphQLString,
        args: {
            id: { type: new GraphQLNonNull(GraphQLID) }
        },
        async resolve(_, args, context) {
            if (!context.usuario || context.usuario.rol !== 'admin') {
                throw new Error('Solo los administradores pueden eliminar usuarios');
            }

            if (!ObjectId.isValid(args.id)) {
                throw new Error('ID no válido');
            }

            const db = await connectDB();

            const resultado = await db.collection('usuarios').deleteOne({
                _id: new ObjectId(args.id)
            });

            if (resultado.deletedCount === 0) {
                throw new Error('Usuario no encontrado');
            }

            return 'Usuario eliminado correctamente';
        }
    }
};
