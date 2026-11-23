import { GraphQLSchema, GraphQLObjectType, GraphQLString } from 'graphql';

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        ping: {
            type: GraphQLString,
            resolve() {
                return 'Servidor GraphQL y MongoDB operativos';
            }
        }
    }
});

export default new GraphQLSchema({
    query: RootQuery
});