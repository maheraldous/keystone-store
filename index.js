const { Keystone } = require('@keystonejs/keystone');
const { PasswordAuthStrategy } = require('@keystonejs/auth-password');
const { Text } = require('@keystonejs/fields');
// Keytone apps
const { GraphQLApp } = require('@keystonejs/app-graphql');
const { AdminUIApp } = require('@keystonejs/app-admin-ui');
const { StaticApp } = require('@keystonejs/app-static');
const { createItems } = require('@keystonejs/server-side-graphql-client');

// Database
const initialiseData = require('./initial-data');
const { MongooseAdapter: Adapter } = require('@keystonejs/adapter-mongoose');

// Gatsby Keystone shop imports
const UserSchema = require('./lists/User.js');
const ProductSchema = require('./lists/Product.js');
const CategorySchema = require('./lists/Category.js');

// App
const PROJECT_NAME = 'Hello Keystone';
const adapterConfig = { mongoUri: 'mongodb://localhost/hello-keystone' };

const keystone = new Keystone({
  name: PROJECT_NAME,
  appVersion: {
    version: '1.0.0',
    addVersionToHttpHeaders: false,
    access: true,
  },
  adapter: new Adapter(adapterConfig),
  onConnect: async keystone => {
    const users = await keystone.lists.User.adapter.findAll();
    if (!users.length) {
      await createItems({
        keystone,
        listKey: 'User',
        items: [
          { data: {
              name: 'Maher Admin',
              username: 'admin',
              email: 'maaheraldoos@gmail.com',
              password: 'maher1998',
              isAdmin: true,
          } },
        ],
      });
    }
  },
  cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  },
  cookieSecret: '6D61822FBEAED8635A4A52241FEC3',
});

// Lists
keystone.createList('User', UserSchema);
keystone.createList('Product', ProductSchema);
keystone.createList('Category', CategorySchema);

// Auth
const logAuth = ({ hooks, ...options }) => {
  return {
    ...options,
    hooks: {
      afterAuth: () => console('A user logged in!'),
      ...hooks,
    },
  };
};
const authStrategy = keystone.createAuthStrategy({
  type: PasswordAuthStrategy,
  list: 'User',
  config: {
    identityField: 'email',
    secretField: 'password'
  },
  plugin: [logAuth],
});

module.exports = {
  keystone,
  apps: [
    new GraphQLApp(),
    new StaticApp({
      path: '/',
      src: 'client/src',
      fallback: 'client/public/index.html'
    }),
    new AdminUIApp({
      name: PROJECT_NAME,
      enableDefaultRoute: true,
      authStrategy
    }),
  ],
  configureExpress: app => {
    app.set('trust proxy', 1);
  }
};