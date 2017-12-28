const { makeExecutableSchema } = require('graphql-tools');

const resolvers = require('./resolvers');

const schema = `

type User {
  _id: String
  firstname: String
  lastname: String
}

type Post @cacheControl(maxAge: 240) {
  _id: String!
  title: String
  createdAt: String
  author: User
  likes: [Like] @cacheControl(maxAge: 30)
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
  user(id: String!): User
  posts (authorId: String): [Post]
  post (id: String!): Post
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
