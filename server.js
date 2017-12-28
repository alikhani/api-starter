require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const compression = require('compression')
const mongoose = require('mongoose')
const morgan = require('morgan')
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express')
const { Engine } = require('apollo-engine')
const schema = require('./graphql/schema');

const {
  setupAuthService,
  authenticate,
  getCurrentUser,
  getOne
} = require('./authService')

const app = express()

const engine = new Engine({
  engineConfig: {
    apiKey: process.env.APOLLO_ENGINE_API_KEY,
    stores: [
      {
        name: 'embeddedCache',
        inMemory: {
          cacheSize: 10485760,
        },
      },
    ],
    persistedQueries: {
      store: 'embeddedCache'
    },
    sessionAuth: {
      store: 'embeddedCache',
      header: 'Authorization',
    },
    queryCache: {
      publicFullQueryStore: 'embeddedCache',
      privateFullQueryStore: 'embeddedCache',
    },
    reporting: {
      debugReports: false,
    },
    logging: {
      level: 'DEBUG',
    },
  },
  graphqlPort: process.env.SERVER_PORT
});

engine.start();

app
  .disable('x-powered-by')
  .use(engine.expressMiddleware())
  .use(compression())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(cors());

setupAuthService(app)

function connect () {
  const connection = mongoose.connect(process.env.MONGO_URI, {
    useMongoClient: true,
  });
  mongoose.Promise = global.Promise;
  return connection;
}

connect()
  .on('error', console.log)
  .on('disconnected', connect)
  .once('open', listen);

app.use('/graphql', authenticate, getCurrentUser, graphqlExpress((req) => {
  const query = req.query.query || req.body.query;
  if (query && query.length > 2000) {
    throw new Error('Query too large.');
  }
  const user = req.user;
  // console.log('user: ',user);
  return {
    schema,
    context: {
      user
    },
    debug: true,
    tracing: true,
    cacheControl: true
  };
}));

app.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql',
}));


function listen() {
  app.listen(process.env.SERVER_PORT, () => console.log(
    `GraphQL Server is now running on http://localhost:${process.env.SERVER_PORT}/graphql`
  ))
}
