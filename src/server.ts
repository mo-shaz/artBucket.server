// Dotenv config
require('dotenv').config()

///////////////////////////////////////////////
//              MODULE IMPORTS              //
/////////////////////////////////////////////
import fastify, { FastifyInstance } from 'fastify'
import { File } from 'fastify-multer/lib/interfaces'
import {IncomingMessage, Server, ServerResponse} from 'http'
import { Pool } from 'pg'
import cookie from 'fastify-cookie'
import session from '@fastify/session'

// I HATE TO DO THIS //
const multer = require('fastify-multer')
const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
// PLEASE FIND A WAY //

import { 
    registerHandler, 
    indexHandler, 
    joinHandler, 
    loginHandler, 
    logoutHandler,
    dashHandler, 
    inviteHandler,
    imageHandler,
    getFileName,
    profileHandler
    } from './handler'

import { IndexSchema, 
    RegisterSchema, 
    JoinSchema, 
    LoginSchema,
    LogoutSchema,
    DashSchema,
    InviteSchema,
    ProfileSchema
    } from './schema'

// Additional Interface fixes
declare module 'fastify' {
    export interface FastifyRequest {
        file: File;
    }
}

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

// Cloudinary-Storage Config
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "Test-Pix",
        public_id: getFileName,
        allowed_formats: ['png', 'jpg', 'svg', 'bmp']
    },
})

// Multer Config
const upload = multer({ storage: storage })

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET
})

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

// MULTER
server.register(multer.contentParser)

/////////////////////////////////////////////////
//                  ROUTES                    //
///////////////////////////////////////////////

// Index Page
server.get('/', IndexSchema, indexHandler)

// Invite
server.post('/join', JoinSchema, joinHandler)

// Register a user
server.post('/register', RegisterSchema, registerHandler)

// Login a user
server.post('/login', LoginSchema, loginHandler)

// Logout a user
server.get('/logout', LogoutSchema,logoutHandler)

// Dashbord Info
server.get('/dashboard', DashSchema, dashHandler)

// Sending Invites
server.post('/invite', InviteSchema, inviteHandler)

// Image Uploads
server.post('/image', { preHandler: upload.single('file') }, imageHandler)

// Edit Profile
server.post('/profile', ProfileSchema, profileHandler)


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
