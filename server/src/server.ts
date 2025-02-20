import dotenv from 'dotenv';
import express, { Application } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs, resolvers } from './schemas/index.js';
import { authMiddleware } from './services/auth.js';
import mongoose from 'mongoose';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
}

const startApolloServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: authMiddleware,
  });

  await server.start();
  server.applyMiddleware({ app: app as any });

  mongoose.connect(MONGO_URI, { dbName: 'mydatabase' });

  mongoose.connection.once('open', () => {
    console.log('🌟 Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🌍 Server running on http://localhost:${PORT}`);
      console.log(`🚀 GraphQL endpoint available at http://localhost:${PORT}${server.graphqlPath}`);
    });
  });

  mongoose.connection.on('error', (err) => {
    console.error('Database connection error:', err);
  });
};

startApolloServer();