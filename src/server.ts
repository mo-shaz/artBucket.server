// Dotenv config
require('dotenv').config()

///////////////////////////////////////////////
//              MODULE IMPORTS              //
/////////////////////////////////////////////
import fastify, {FastifyInstance} from 'fastify'
import {IncomingMessage, Server, ServerResponse} from 'http'
import { Pool } from 'pg'
import cookie from 'fastify-cookie'
import session from '@fastify/session'

import { registerHandler, indexHandler, joinHandler, loginHandler, logoutHandler, dashHandler, inviteHandler } from './handler'
import { IndexSchema, RegisterSchema, RegisterType , JoinSchema, LoginSchema, LogoutSchema, DashSchema, InviteSchema } from './schema'


///////////////////////////////////////////////
//                  CONFIG                  //
/////////////////////////////////////////////

// Instantiate the server
const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({
    logger: {
        level: 'info'
    }
})

// Database Config
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: (process.env.DB_PORT as number | undefined),
    password: process.env.DB_PW,
    database: process.env.DB_NAME,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
}

// Database Connection Pool
export const dbPool = new Pool(dbConfig)

///////////////////////////////////////////////////
//                  PLUGINS                     //
/////////////////////////////////////////////////

// CORS
server.register(require('fastify-cors'), {
    origin: true,
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
})

// COOKIE AND SESSION
server.register(cookie)

server.register(session, {
    cookieName: 'sessionId',
    secret: (process.env.SESSION_SECRET as string),
    cookie: { secure: false, maxAge: 604800000, httpOnly: true}
})


/////////////////////////////////////////////////
//                  ROUTES                    //
///////////////////////////////////////////////

// Index Page
server.get('/', IndexSchema, indexHandler)

// Invite
server.post('/join', JoinSchema, joinHandler)

// Register a user
server.post<{ Body: RegisterType }>('/register', RegisterSchema, registerHandler)

// Login a user
server.post('/login', LoginSchema, loginHandler)

// Logout a user
server.get('/logout', LogoutSchema,logoutHandler)

// Dashbord Info
server.get('/dashboard', DashSchema, dashHandler)

// Sending Invites
server.post('/invite', InviteSchema, inviteHandler)


///////////////////////////////////////////////
//                  SERVER                  //
/////////////////////////////////////////////

const startServer = async () => {
    server.listen(8080, (err, address) => {
        if (err) {

            console.error(err)
            process.exit(1)
        }

        console.log(`Server listening at ${address}`)
    })
}

startServer()
