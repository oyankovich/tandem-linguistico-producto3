import {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString
} from 'graphql';

import {
    usuariosQuery,
    usuariosMutation
} from './usuarios.js';

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
        ...usuariosQuery
    }
});

// Modificaciones
const RootMutation = new GraphQLObjectType({
    name: 'RootMutationType',
    fields: {
        ...usuariosMutation
    }
});

export default new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation
});
