import {FastifyReply, FastifyRequest} from "fastify"
import bcrypt from 'bcrypt'

import { dbPool } from "./server"
import { RegisterType, JoinType, LoginType, InviteType } from "./schema"


///////////////////////////////////////////////////////////////
//                      REGISTER A USER                     //
/////////////////////////////////////////////////////////////

export const registerHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {

        const { userName, email, title, storeName, password, confirmPassword } = (req.body as RegisterType)

        // Check if password and confirm-password fields match
        // Already do this on the client side, just to make sure    
        if (password !== confirmPassword) return reply.code(400).send({ error: 'Passwords do not match' })

        // Grab a client from the dbPool (this is good for performance reasons)
        const client = await dbPool.connect()

        // Check if the email is already registered
        const emailQuery = await client.query('SELECT EXISTS(SELECT 1 FROM creators WHERE email=$1)', [email])

        if (emailQuery.rows[0].exists === true) {
            // release the client [IMPORTANT]
            client.release()

            return reply.code(400).send({ error: `user with email '${email}' already exists` })
        }
        
        // Check storeName availability
        const storeQuery = await client.query('SELECT EXISTS(SELECT 1 FROM creators WHERE store_name=$1)', [storeName])

        if (storeQuery.rows[0].exists === true) {
            // release the client [IMPORTANT]
            client.release()

            return reply.code(400).send({ error: `the storename '${storeName}' is already taken` })
        }

        // If everything checks out, insert a new user into the database
        // Before inserting data into databse, hash the password
        const hashedPass = await bcrypt.hash(password, 10)

        const response = await client.query('INSERT INTO creators(user_name, email, store_name, title, hashed_pass) VALUES($1, $2, $3, $4, $5) RETURNING id;', [userName, email, storeName, title, hashedPass])

        // Release the client finally
        client.release()

        reply.code(201).send({ success: `UserId: ${response.rows[0].id}` })

    } catch (err) {

        // Catch funky errors :(
        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })

    }
}


///////////////////////////////////////////////////////////////
//                      INDEX ENDPOINT                      //
/////////////////////////////////////////////////////////////

export const indexHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        
        // Sacred Rituals
        req = req

        // Get the number of rows of the database
        const countQuery = await dbPool.query('SELECT COUNT(*) FROM creators;')
        const count = countQuery.rows[0].count.toString()
        return reply.code(200).send({ success: count })
        
        
    } catch (err) {
        
        // No errors please :|
        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }
}


///////////////////////////////////////////////////////////////
//                      JOIN ENDPOINT                       //
/////////////////////////////////////////////////////////////

export const joinHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {

        // Get the code from the request body
        const { emailInvite } = (req.body as JoinType)

        // Decode the encoded invite code
        const dCode = Buffer.from(emailInvite, 'base64').toString('ascii') 

        // Return the decoded value
        return reply.code(200).send({ emailInvite: dCode })

    } catch (err) {

        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERRROR" })
    }

}


///////////////////////////////////////////////////////////////
//                      LOGIN ENDPOINT                      //
/////////////////////////////////////////////////////////////

export const loginHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    
    try {

        // Dismantle the body (x x)
        const { email, password } = (req.body as LoginType)

        // Grab a client from the dbPool (this is good for performance reasons)
        const client = await dbPool.connect()

        // Check if the email exists
        const emailQuery = await client.query('SELECT EXISTS(SELECT 1 FROM creators WHERE email=$1)', [email])

        if (emailQuery.rows[0].exists === false ) {
            // release the client [IMPORTANT]
            client.release()

            return reply.code(400).send({ error: "invalid email or password" })
        }

        // Check if the password is correct
        // Get the password hash from the DB
        const hashQuery = await client.query('SELECT hashed_pass FROM creators WHERE email=$1', [email])
        const hashedPass = hashQuery.rows[0].hashed_pass

        // Check it
        const checkFlag = await bcrypt.compare(password, hashedPass)
        if (!checkFlag) {
            // release the client [IMPORTANT]
            client.release()

            return reply.code(400).send({ error: "invalid email or password" })
        }

        // If everything checks out okay
        // Set the session header
        req.session.authenticated = true
        
        // Save the sessionId in the database
        const { sessionId } = req.session
        await client.query('UPDATE creators SET session_id=$1 WHERE email=$2', [sessionId, email])

        // Release the client finally
        client.release()

        // Send a success reply
        return reply.send({ success: "login successful" })

    } catch (err) {

        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }
}


///////////////////////////////////////////////////////////////
//                      LOGOUT ENDPOINT                     //
/////////////////////////////////////////////////////////////

export const logoutHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    // Check if authenticated
    if (req.session.authenticated) {
        req.destroySession((err) => {
            if (err) return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
            return reply.code(200).send({ success: "UNAUTHENTICATED" })
        })

    } else {
        // if authenticated, just send an OK status
        return reply.code(200).send({ success: "UNAUTHENTICATED" })
    } 
}


///////////////////////////////////////////////////////////////////
//                      DASHBOARD ENDPOINT                      //
/////////////////////////////////////////////////////////////////

export const dashHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {

        // Check if the user is authenticated
        if (!req.session.authenticated) return reply.code(400).send({ error: 'redirect to /login' })
        
        // The sessionId
        const { sessionId } = await req.session

        // Grab a client from the dbPool
        const client = await dbPool.connect()

        // Get the details from the database
        const dashQuery = await client.query('SELECT user_name, store_name, title, whatsapp, instagram FROM creators WHERE session_id=$1', [sessionId])
        const data = await dashQuery.rows[0]

        // Get the product list
        const { store_name } = data
        const productQuery = await client.query('SELECT id, image FROM products WHERE store_id=$1', [store_name])
        const productList = productQuery.rows

        // Finally, release the client
        client.release()

        // Construct a response data
        const resData = {
            userName: data.user_name,
            storeName: data.store_name,
            title: data.title,
            whatsapp: data.whatsapp,
            instagram: data.instagram,
            products: productList
        }

        return reply.code(200).send({ success: resData })

    } catch (err) {

        // Please no
        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }

}


///////////////////////////////////////////////////////////////////
//                      INVITES ENDPOINT                        //
/////////////////////////////////////////////////////////////////

export const inviteHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {
        // check authentication ofcouse :D
        if (!req.session.authenticated) return reply.code(400).send({ error: "UNAUTHORIZED ACCESS" })
        
        // get the body
        const { inviteEmail } = (req.body as InviteType)

        // check if the email is aleady registered
        const emailQuery = await dbPool.query('SELECT EXISTS(SELECT 1 FROM creators WHERE email=$1)', [inviteEmail])

        // if exists, return a reply
        if (emailQuery.rows[0].exists) return reply.code(400).send({ error: "user is already registered" })

        /*
         *                      NODE-MAILER STUFF
         *                        FIGURE IT OUT                     */

        // if everything checks out, send confirmation back
        return reply.code(200).send({ success: "invite send successfully" })

    } catch (err) {
        console.log(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }
}
