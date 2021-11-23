// Dotenv config
require('dotenv').config()

///////////////////////////////////////////////
//              MODULE IMPORTS              //
/////////////////////////////////////////////
import fastify, {FastifyInstance} from 'fastify'
import {IncomingMessage, Server, ServerResponse} from 'http'
import { Pool } from 'pg'

import { registerHandler, indexHandler, inviteHandler } from './handler'
import { RegisterSchema, RegisterType , InviteSchema} from './schema'



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
    origin: '*',
    methods: ['GET', 'POST'],
    allowheaders: ['Content-Type', 'Authorization']
})




/////////////////////////////////////////////////
//                  ROUTES                    //
///////////////////////////////////////////////

// Register a user
server.post<{ Body: RegisterType }>('/register', RegisterSchema, registerHandler)

// Index Page
server.get('/', indexHandler)

// Invite
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
