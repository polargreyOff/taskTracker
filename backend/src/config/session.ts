const sessionConfig = {
  secret:       process.env.SESSION_SECRET ?? 'dev-only-do-not-use-in-prod',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000,
}

export default sessionConfig
