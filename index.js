import path from "path";

import "dotenv/config.js";
import express from "express";
import mongoose from "mongoose";

import typeDefs from "./graphql/schema.js";
import resolvers from "./graphql/resolvers.js";
import auth from "./middlewares/auth.js";

import { createServer } from "http";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import { graphqlUploadExpress } from "graphql-upload";

const MONGO_URI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI
    : "mongodb://localhost/graphql";

try {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  });
  console.log("Database connection successful !!!");
} catch (error) {
  console.log(error);
}

const app = express();
const httpServer = createServer(app);
const __dirname = path.resolve();
const schema = makeExecutableSchema({ typeDefs, resolvers });
const server = new ApolloServer({
  schema,
  formatError: (err) => {
    const code = err.originalError.code || 500;
    return { code, ...err };
  },
  context: ({ req, res }) => ({ req }),
  introspection: true,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
});
await server.start();

app.use(auth);
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(graphqlUploadExpress());
server.applyMiddleware({ app });

const subscriptionServer = SubscriptionServer.create(
  {
    schema,
    execute,
    subscribe,
  },
  {
    server: httpServer,
    path: server.graphqlPath,
  }
);

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    subscriptionServer.close();
    httpServer.close(() => {
      process.exit(0);
    });
  });
});

httpServer.listen(process.env.PORT, () => {
  console.log(`http://localhost:${process.env.PORT}`);
});
