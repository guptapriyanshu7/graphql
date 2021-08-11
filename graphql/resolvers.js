import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import User from '../models/user.js';
import Post from '../models/post.js';
import { clearImage } from '../utils/clear-image.js';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLUpload } from 'graphql-upload';
import { finished } from 'stream/promises';
import fs from 'fs';
import path from 'path';

const pubsub = new PubSub();
const __dirname = path.resolve();

export default {
  Query: {
    login: async (_, { email, password }, { req }, __) => {
      const user = await User.findOne({ email: email });
      if (!user) {
        const error = new Error('User not found.');
        error.code = 401;
        throw error;
      }
      const isEqual = await bcrypt.compare(password, user.password);
      if (!isEqual) {
        const error = new Error('Password is incorrect.');
        error.code = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
        },
        'somesupersecretsecret',
        { expiresIn: '1d' }
      );
      return { token: token, userId: user._id.toString() };
    },
    posts: async (_, { page = 1 }, { req }, __) => {
      if (!req.isAuth) {
        const error = new Error('Not authenticated!');
        error.code = 401;
        throw error;
      }
      const perPage = 2;
      const totalPosts = await Post.find().countDocuments();
      const posts = await Post.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate('creator');
      return {
        posts: posts.map((p) => {
          return {
            ...p._doc,
            _id: p._id.toString(),
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          };
        }),
        totalPosts: totalPosts,
      };
    },
    post: async (_, { id }, { req }, __) => {
      if (!req.isAuth) {
        const error = new Error('Not authenticated!');
        error.code = 401;
        throw error;
      }
      const post = await Post.findById(id).populate('creator');
      if (!post) {
        const error = new Error('No post found!');
        error.code = 404;
        throw error;
      }
      return {
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    },
    user: async (_, args, { req }, __) => {
      if (!req.isAuth) {
        const error = new Error('Not authenticated!');
        error.code = 401;
        throw error;
      }
      const user = await User.findById(req.userId);
      if (!user) {
        const error = new Error('No user found!');
        error.code = 404;
        throw error;
      }
      return { ...user._doc, _id: user._id.toString() };
    },
  },
  Upload: GraphQLUpload,
  Mutation: {
    createUser: async (_, { userInput }, { req }, __) => {
      const errors = [];
      if (!validator.isEmail(userInput.email)) {
        errors.push({ message: 'E-Mail is invalid.' });
      }
      if (!validator.isLength(userInput.password, { min: 5 })) {
        errors.push({ message: 'Password too short!' });
      }
      if (errors.length > 0) {
        const error = new Error('Invalid input.');
        error.data = errors;
        error.code = 422;
        throw error;
      }
      const dupUser = await User.findOne({ email: userInput.email });
      if (dupUser) {
        const error = new Error('User exists already!');
        throw error;
      }
      const hashedPassword = await bcrypt.hash(userInput.password, 12);
      const user = new User({
        email: userInput.email,
        name: userInput.name,
        password: hashedPassword,
      });
      await user.save();
      return { ...user._doc, _id: user._id.toString() };
    },

    createPost: async (_, { postInput }, { req }, __) => {
      if (!req.isAuth) {
        const error = new Error('Unauthorized!');
        error.code = 401;
        throw error;
      }
      const errors = [];
      if (!validator.isLength(postInput.title, { min: 5 })) {
        errors.push({ message: 'Title is invalid.' });
      }
      if (!validator.isLength(postInput.content, { min: 5 })) {
        errors.push({ message: 'Content is invalid.' });
      }
      const file = await postInput.imageFile;
      if (!file.filename) {
        errors.push({ message: 'No image provided.' });
      }
      if (errors.length > 0) {
        const error = new Error('Invalid input.');
        error.data = errors;
        error.code = 422;
        throw error;
      }
      const user = await User.findById(req.userId);
      if (!user) {
        const error = new Error('Invalid user.');
        error.code = 401;
        throw error;
      }
      const filename = await singleUpload(file);
      const post = new Post({
        title: postInput.title,
        content: postInput.content,
        imageUrl: filename,
        creator: user,
      });
      await post.save();
      user.posts.push(post);
      await user.save();
      pubsub.publish('POST_CREATED', { postCreated: post });
      return {
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    },

    updatePost: async (_, { id, postInput }, { req }, __) => {
      if (!req.isAuth) {
        const error = new Error('Not authenticated!');
        error.code = 401;
        throw error;
      }
      const errors = [];
      if (!validator.isLength(postInput.title, { min: 5 })) {
        errors.push({ message: 'Title is invalid.' });
      }
      if (!validator.isLength(postInput.content, { min: 5 })) {
        errors.push({ message: 'Content is invalid.' });
      }
      if (errors.length > 0) {
        const error = new Error('Invalid input.');
        error.data = errors;
        error.code = 422;
        throw error;
      }
      const post = await Post.findById(id).populate('creator');
      if (!post) {
        const error = new Error('No post found!');
        error.code = 404;
        throw error;
      }
      if (post.creator._id.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.code = 403;
        throw error;
      }
      post.title = postInput.title;
      post.content = postInput.content;
      if (postInput.imageUrl !== 'undefined') {
        post.imageUrl = postInput.imageUrl;
      }
      await post.save();
      pubsub.publish('POST_UPDATED', { postUpdated: post });
      return {
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    },
    deletePost: async (_, { id }, { req }, __) => {
      if (!req.isAuth) {
        const error = new Error('Not authenticated!');
        error.code = 401;
        throw error;
      }
      const post = await Post.findById(id);
      if (!post) {
        const error = new Error('No post found!');
        error.code = 404;
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.code = 403;
        throw error;
      }
      try {
        await post.remove();
        clearImage(post.imageUrl);
        const user = await User.findById(req.userId);
        user.posts.pull(id);
        await user.save();
        return true;
      } catch (error) {
        return false;
      }
    },
    updateStatus: async (_, { status }, { req }, __) => {
      if (!req.isAuth) {
        const error = new Error('Not authenticated!');
        error.code = 401;
        throw error;
      }
      const user = await User.findById(req.userId);
      if (!user) {
        const error = new Error('No user found!');
        error.code = 404;
        throw error;
      }
      user.status = status;
      await user.save();
      return { ...user._doc, _id: user._id.toString() };
    }
  },
  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator(['POST_CREATED']),
    },
    postUpdated: {
      subscribe: () => pubsub.asyncIterator(['POST_UPDATED']),
    },
  },
};

async function singleUpload(file) {
  const { createReadStream, filename, mimetype, encoding } = file;
  const stream = createReadStream();
  const updatedFileName = new Date()
    .toISOString()
    .replace(/:/g, '-') + '-' + filename;
  const savePath = path
    .join(__dirname, 'images', updatedFileName);
  const out = fs
    .createWriteStream(savePath);
  stream.pipe(out);
  await finished(out);
  return updatedFileName;
}