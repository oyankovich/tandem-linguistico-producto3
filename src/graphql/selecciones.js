import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLID,
    GraphQLList,
    GraphQLNonNull
} from 'graphql';

import { ObjectId } from 'mongodb';
import { connectDB } from '../config/db.js';
import { requiereAutenticacion } from './auth.js';

/**
 * Tipo GraphQL de un intercambio seleccionado.
 * Equivale al objeto que guardaba el almacén "seleccionados" del producto 2:
 * una copia del intercambio que el usuario ha añadido a "Mi selección".
 */
const SeleccionadoType = new GraphQLObjectType({
    name: 'Seleccionado',
    fields: {
        id: {
            type: GraphQLID,
            resolve: seleccionado => seleccionado.intercambioId.toString()
        },
        titulo: { type: GraphQLString },
        email: { type: GraphQLString },
        fecha: { type: GraphQLString },
        idioma: { type: GraphQLString },
        nivel: { type: GraphQLString },
        descripcion: { type: GraphQLString },
        tipo: { type: GraphQLString }
    }
});

/**
 * Convierte el id recibido en un ObjectId de MongoDB.
 * @param {string} id Id del intercambio en formato texto.
 * @returns {ObjectId} Id listo para usar en las consultas.
 * @throws {Error} Si el id no tiene un formato válido.
 */
function convertirId(id) {
    if (!ObjectId.isValid(id)) {
        throw new Error('ID no válido');
    }

    return new ObjectId(id);
}

// Consultas
export const seleccionesQuery = {

    /**
     * Devuelve los intercambios seleccionados por el usuario que ha iniciado sesión.
     * Equivale a obtenerSeleccionados() del producto 2.
     */
    seleccionados: {
        type: new GraphQLList(SeleccionadoType),
        async resolve(_, args, context) {
            const usuario = requiereAutenticacion(context);
            const db = await connectDB();

            return db.collection('seleccionados')
                .find({ usuarioId: usuario.id })
                .toArray();
        }
    }
};

// Modificaciones
export const seleccionesMutation = {

    /**
     * Añade un intercambio a la selección del usuario. Si ya estaba, actualiza sus datos.
     * Equivale a guardarSeleccionado() del producto 2.
     */
    guardarSeleccionado: {
        type: SeleccionadoType,
        args: {
            id: { type: new GraphQLNonNull(GraphQLID) }
        },
        async resolve(_, args, context) {
            const usuario = requiereAutenticacion(context);
            const intercambioId = convertirId(args.id);
            const db = await connectDB();

            const intercambio = await db.collection('intercambios')
                .findOne({ _id: intercambioId });

            if (!intercambio) {
                throw new Error('Intercambio no encontrado');
            }

            const seleccionado = {
                usuarioId: usuario.id,
                intercambioId,
                titulo: intercambio.titulo,
                email: intercambio.email,
                fecha: intercambio.fecha,
                idioma: intercambio.idioma,
                nivel: intercambio.nivel,
                descripcion: intercambio.descripcion,
                tipo: intercambio.tipo
            };

            await db.collection('seleccionados').updateOne(
                { usuarioId: usuario.id, intercambioId },
                { $set: seleccionado },
                { upsert: true }
            );

            return seleccionado;
        }
    },

    /**
     * Quita un intercambio de la selección del usuario.
     * Equivale a borrarSeleccionado() del producto 2.
     */
    borrarSeleccionado: {
        type: GraphQLString,
        args: {
            id: { type: new GraphQLNonNull(GraphQLID) }
        },
        async resolve(_, args, context) {
            const usuario = requiereAutenticacion(context);
            const intercambioId = convertirId(args.id);
            const db = await connectDB();

            const resultado = await db.collection('seleccionados').deleteOne({
                usuarioId: usuario.id,
                intercambioId
            });

            if (resultado.deletedCount === 0) {
                throw new Error('Ese intercambio no está en tu selección');
            }

            return 'Intercambio quitado de la selección correctamente';
        }
    }
};