import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import pool from '../db'
import sessionConfig from '../config/session'

const PgStore = connectPgSimple(session)

const sessionMiddleware = session({
  store: new PgStore({
    pool,
    tableName: 'pg_sessions',
    createTableIfMissing: true,
  }),
  secret: sessionConfig.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: sessionConfig.cookieMaxAge,
  },
})

export default sessionMiddleware
