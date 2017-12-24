const { makeExecutableSchema } = require('graphql-tools');

const resolvers = require('./resolvers');

const schema = `

type User {
  _id: String
  firstname: String
  lastname: String
}

type Post {
  _id: String!
  title: String
  createdAt: String
  author: User
  likes: [Like]
}

input postInput {
  title: String!
}

type Like {
  _id: String!
  postId: String!
  user: User!
}



# the schema allows the following query:
type Query {
  user(id: String): User
  posts: [Post]
}

# this schema allows the following mutation:
type Mutation {

  likePost (
    postId: String!
  ): Post

  createPost(
    post: postInput
  ): Post

}


`;

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});
