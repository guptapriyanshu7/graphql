import path from 'path';

import express from 'express';
import mongoose from 'mongoose';

import typeDefs from './graphql/schema.js';
import resolvers from './graphql/resolvers.js';
import auth from './middlewares/auth.js';

import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import {
  ApolloServerPluginLandingPageGraphQLPlayground
} from "apollo-server-core"
import { ApolloServer } from 'apollo-server-express';
import { graphqlUploadExpress } from 'graphql-upload';

try {
  await mongoose.connect('mongodb://localhost/graphql', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  });
  console.log('Database connection successful !!!');
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
  context: ({ req, res }) => (
    { req }
  ),
  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
});
await server.start();

app.use(auth);
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(graphqlUploadExpress());
server.applyMiddleware({ app });

const subscriptionServer = SubscriptionServer.create({
  schema,
  execute,
  subscribe,
}, {
  server: httpServer,
  path: server.graphqlPath,
});

['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => subscriptionServer.close());
});


httpServer.listen(8080, () => {
  console.log('http://localhost:8080');
});
// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'images');
//   },
//   filename: (req, file, cb) => {
//     cb(
//       null,
//       new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname
//     );
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (
//     file.mimetype === 'image/png' ||
//     file.mimetype === 'image/jpg' ||
//     file.mimetype === 'image/jpeg'
//   ) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

// app.use(
//   multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
// );

// app.put('/upload-image', (req, res, next) => {
//   if (!req.isAuth) {
//     throw new Error('Not authenticated!');
//   }
//   if (!req.file) {
//     return res.status(200).json({ message: 'No file provided!' });
//   }
//   if (req.body.oldPath) {
//     clearImage(req.body.oldPath);
//   }
//   return res.status(201).json({
//     message: 'File stored.',
//     filePath: req.file.path.replace(/\\/g, '/'),
//   });
// });

