///////////////////////////////////////////////
//              MODULE IMPORTS              //
/////////////////////////////////////////////
import fastify, {FastifyInstance} from 'fastify'
import {IncomingMessage, Server, ServerResponse} from 'http'
import { Pool } from 'pg'

import { registerHandler } from './handler'
import { RegisterSchema, RegisterType } from './schema'



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
export const dbPool = new Pool({
    host: '127.0.0.1',
    user: 'postgres',
    port: 5432,
    password: 'furygres',
    database: 'artbucket',
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
})

///////////////////////////////////////////////////
//                  PLUGINS                     //
/////////////////////////////////////////////////




/////////////////////////////////////////////////
//                  ROUTES                    //
///////////////////////////////////////////////

// Register a user
server.post<{ Body: RegisterType }>('/register', RegisterSchema, registerHandler)





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
