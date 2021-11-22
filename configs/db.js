require('dotenv').config()

if (process.env.SCHEMA_INIT == 'postgresdb') {
  module.exports = {
    production: {
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      dialect: process.env.DB_DRIVER
    },
    localhost: {
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      dialect: process.env.DB_DRIVER
    }
  }
} else if (process.env.SCHEMA_INIT == 'mongodb') {
  module.exports = {
    production: {
      mongo_uri: process.env.MONGO_URI
    },
    localhost: {
      mongo_uri: process.env.MONGO_URI
    }
  }
} else {
  throw new Error('Required load SCHEMA_INIT as database initialize in .env');
}

