# PostNode GraphQL Server

[![GitHub issues](https://img.shields.io/github/issues/guptapriyanshu7/graphql?style=for-the-badge)](https://github.com/guptapriyanshu7/graphql/issues)
[![GitHub stars](https://img.shields.io/github/stars/guptapriyanshu7/graphql?style=for-the-badge)](https://github.com/guptapriyanshu7/graphql/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/guptapriyanshu7/graphql?style=for-the-badge)](https://github.com/guptapriyanshu7/graphql/network)
[![GitHub license](https://img.shields.io/github/license/guptapriyanshu7/graphql?style=for-the-badge)](https://github.com/guptapriyanshu7/graphql/blob/apollo/LICENSE)

> A feature rich API for blog-like applications in GraphQL using Apollo.

Handles image-upload, uses web-sockets for live feed, authentication using JWT and graphQL server using the apollo library.

# Folder Structure

```
graphql
├───graphql (GraphQL resolvers and schema.)
├───middlewares (Contains the Auth middleware which validates JWT token.)
├───models (Auth and Feed Schema for MongoDB.)
└───utils (Utilities folder.)
```

# Tools

- `Dev` Node.js, Apollo Server, Socket.io, Mongoose, Sendgrid

## Local Setup

- Clone this repo: `git clone https://github.com/guptapriyanshu7/graphql`
- Run `npm install`
- Setup environment variables :
  - Create a `.env` file in root directory of the project
  - Insert these 3 keys/value pairs :
    - **PORT** : _< Port on which server will listen >_
    - **MONGO_URI** : _< Mongo database connection URI >_
    - **SECRET** : _< Secret for jwt tokens >_
- Start the server: `npm start`
- Start requesting from http://localhost:PORT/graphql.

## Example Queries

```
  mutation CreatePost($postInput: PostInputData!) {
    createPost(postInput: $postInput) {
      title
      content
      imageUrl
      createdAt
    }
  }
```

```
  mutation UpdatePost($id: ID!, $postInput: PostUpdateData!) {
    updatePost(id: $id, postInput: $postInput) {
      title
      content
      imageUrl
      createdAt
    }
  }
```

```
 query SinglePost($id: ID!) {
    post(id: $id) {
      title
      content
      imageUrl
    }
  }
```

```
  query Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      userId
    }
  }
```

```
  subscription {
    postCreated {
      _id
      title
      content
    }
  }
```

```
  query GetPosts($page: Int) {
    getPosts(page: $page) {
      totalPosts
      posts {
        _id
        title
        content
      }
    }
  }
```

```
  mutation Register($userInput: UserInputData!) {
    createUser(userInput: $userInput) {
      _id
    }
  }
```

```
  query {
    user {
      _id
      name
    }
  }
```

```
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
```

**Frontend** - https://post-node-web.herokuapp.com/ \
**REST alternative** - https://github.com/guptapriyanshu7/rest-api

# License

This project is licensed under the MIT License, © 2021 Priyanshu Gupta. See [LICENSE](https://github.com/guptapriyanshu7/graphql/blob/apollo/LICENSE) for more details.
