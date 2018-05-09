require('dotenv').config({ path: './.env' });

export default {
  env: process.env.NODE_ENV || 'development',
  server: {
    port: process.env.SERVER_PORT,
  },
  acceptedHosts: process.env.ACCEPTED_HOSTS.split(','),
  redis: {
    url: process.env.REDIS_URL
  },
  database: {
    uri: process.env.MONGODB_URI
  },
  logger: {
    host: process.env.LOGGER_HOST,
    port: process.env.LOGGER_PORT
  },
  jwt: {
    secret: process.env.JWT_SECRET
  },
  session: {
    secret: process.env.SESSION_SECRET
  },
  stripe: {
    publishable: process.env.STRIPE_PUBLISHABLE,
    secret: process.env.STRIPE_SECRET
  },
  email: {
    sender: {
      default: {
        name: process.env.EMAIL_SENDER_DEFAULT_NAME,
        email: process.env.EMAIL_SENDER_DEFAULT_EMAIL
      },
      support: {
        name: process.env.EMAIL_SENDER_SUPPORT_NAME,
        email: process.env.EMAIL_SENDER_SUPPORT_EMAIL
      },
    },
    sendgrid: {
      secret: process.env.EMAIL_SENDGRID_SECRET
    }
  }
};
