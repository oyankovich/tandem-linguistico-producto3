import {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString
} from 'graphql';

import {
    usuariosQuery,
    usuariosMutation
} from './usuarios.js';

import {
    seleccionesQuery,
    seleccionesMutation
} from './selecciones.js';

// Consultas
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        ping: {
            type: GraphQLString,
            resolve() {
                return 'Servidor GraphQL y MongoDB operativos';
            }
        },
        ...usuariosQuery,
        ...seleccionesQuery
    }
});

// Modificaciones
const RootMutation = new GraphQLObjectType({
    name: 'RootMutationType',
    fields: {
        ...usuariosMutation,
        ...seleccionesMutation
    }
});

export default new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation
});
