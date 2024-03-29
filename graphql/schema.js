import { gql } from "apollo-server";

export default gql`
  scalar Upload

  type Post {
    _id: ID!
    title: String!
    content: String!
    imageUrl: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }

  type User {
    _id: ID!
    email: String!
    name: String!
    password: String!
    status: String!
    posts: [Post!]!
  }

  type AuthData {
    token: String!
    userId: String!
  }

  type PostData {
    posts: [Post!]!
    totalPosts: Int!
  }

  input UserInputData {
    email: String!
    name: String!
    password: String!
  }

  input PostInputData {
    title: String!
    content: String!
    imageFile: Upload!
  }

  input PostUpdateData {
    title: String!
    content: String!
    imageFile: Upload
  }

  type Query {
    getPosts(page: Int): PostData!
    post(id: ID!): Post!
    user: User!
  }

  type Mutation {
    login(email: String!, password: String!): AuthData!
    createUser(userInput: UserInputData): User!
    createPost(postInput: PostInputData): Post!
    updatePost(id: ID!, postInput: PostUpdateData): Post!
    deletePost(id: ID!): Boolean
    updateStatus(status: String!): User!
  }

  type Subscription {
    postCreated: Post!
    postUpdated: Post!
  }
`;
