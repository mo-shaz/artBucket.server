import {FastifyReply, FastifyRequest} from "fastify"
import bcrypt from 'bcrypt'

import { dbPool } from "./server"
import {RegisterType} from "./schema"

// Registering Users
const registerHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {

        const { userName, email, title, storeName, pass, confirmPass } = (req.body as RegisterType)

        // Check if password and confirm-password fields match
        // Already do this on the client side, just to make sure    
        if (pass !== confirmPass) return reply.code(400).send({ error: 'Passwords do not match' })

        // Check if the email is already registered
        const emailQuery = await dbPool.query('SELECT EXISTS(SELECT 1 FROM creators WHERE email=$1)', [email])
        if (emailQuery.rows[0].exists === true) return reply.code(400).send({ error: `User with email: ${email} already exists` })
        
        // Check userName availability
        const userQuery = await dbPool.query('SELECT EXISTS(SELECT 1 FROM creators WHERE user_name=$1)', [userName])
        if (userQuery.rows[0].exists === true) return reply.code(400).send({ error: `The username: ${userName} is already taken` })

        // Check storeName availability
        const storeQuery = await dbPool.query('SELECT EXISTS(SELECT 1 FROM creators WHERE store_name=$1)', [storeName])
        if (storeQuery.rows[0].exists === true) return reply.code(400).send({ error: `The storename: ${storeName} is already taken` })

        // If everything checks out, insert a new user into the database
        // Before inserting data into databse, hash the password
        const hashedPass = await bcrypt.hash(pass, 10)

        const response = await dbPool.query('INSERT INTO creators(user_name, email, store_name, title, hashed_pass, invited_by) VALUES($1, $2, $3, $4, $5, $6) RETURNING id;', [userName, email, storeName, title, hashedPass, 1])

        reply.code(201).send({ success: `UserId: ${response.rows[0].id}` })

    } catch (err) {

        // Catch funky errors :-(
        console.error(err)
        reply.code(500).send({ error: "INTERNAL SERVER ERROR" })

    }
}








export {
    registerHandler
}
