import {FastifyReply, FastifyRequest} from "fastify"
import bcrypt from 'bcrypt'

import { dbPool } from "./server"
import { RegisterType, InviteType, LoginType } from "./schema"

///////////////////////////////////
//      Utility Functions       //
/////////////////////////////////


// [[ TEMPORARY ]] Simple cipher algorithm. [[ TEMPORARY ]] //
// Can be used to both encrypt and decrypt the invite string 
const cipher = function(message: string, key = 365): string {
    
    // Loop through the characters in the message
    let cipherText = ""
    let messageLength = message.length

    for (let i = 0; i < messageLength; i++) {

        // Get the character code of the character
        const charCode = message[i].charCodeAt(0)

        // X-OR with the key
        const xorCode = charCode ^ key

        // Convert the code to character
        const cipherChar = String.fromCharCode(xorCode)

        // Push it to the string
        cipherText += cipherChar
    }

    return cipherText
}



// Registering Users
export const registerHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {

        const { userName, email, title, storeName, password, confirmPassword } = (req.body as RegisterType)

        // Check if password and confirm-password fields match
        // Already do this on the client side, just to make sure    
        if (password !== confirmPassword) return reply.code(400).send({ error: 'Passwords do not match' })

        // Check if the email is already registered
        const emailQuery = await dbPool.query('SELECT EXISTS(SELECT 1 FROM creators WHERE email=$1)', [email])
        if (emailQuery.rows[0].exists === true) return reply.code(400).send({ error: `user with email '${email}' already exists` })
        
        // Check storeName availability
        const storeQuery = await dbPool.query('SELECT EXISTS(SELECT 1 FROM creators WHERE store_name=$1)', [storeName])
        if (storeQuery.rows[0].exists === true) return reply.code(400).send({ error: `the storename '${storeName}' is already taken` })

        // If everything checks out, insert a new user into the database
        // Before inserting data into databse, hash the password
        const hashedPass = await bcrypt.hash(password, 10)

        const response = await dbPool.query('INSERT INTO creators(user_name, email, store_name, title, hashed_pass, invited_by) VALUES($1, $2, $3, $4, $5, $6) RETURNING id;', [userName, email, storeName, title, hashedPass, 1])

        reply.code(201).send({ success: `UserId: ${response.rows[0].id}` })

    } catch (err) {

        // Catch funky errors :(
        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })

    }
}


// Index page: to display the number of users
export const indexHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        
        // Sacred Rituals
        req = req

        // Get the number of rows of the database
        const countQuery = await dbPool.query('SELECT COUNT(*) FROM creators;')
        const count = countQuery.rows[0].count
        return reply.code(200).send(count)
        
        
    } catch (err) {
        
        // No errors please :|
        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }
}


// Invite page: to send an unhashed response
export const inviteHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {

        // Get the code from the request body
        const { emailInvite } = (req.body as InviteType)

        // Decrypt the encrypted invite code
        const decipher = cipher(emailInvite)

        // Return the deciphered value
        return reply.code(200).send({ emailInvite: decipher })

    } catch (err) {

        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERRROR" })
    }

}


// Login Page
export const loginHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    
    try {

        // Dismantle the body (x x)
        const { email, password } = (req.body as LoginType)

        // Check if the email exists
        const emailQuery = await dbPool.query('SELECT EXISTS(SELECT 1 FROM creators WHERE email=$1)', [email])
        if (emailQuery.rows[0].exists === false ) return reply.code(400).send({ error: "invalid email or password" })

        // Check if the password is correct
        // Get the password hash from the DB
        const hashQuery = await dbPool.query('SELECT hashed_pass FROM creators WHERE email=$1', [email])
        const hashedPass = hashQuery.rows[0].hashed_pass

        // Check it
        const checkFlag = await bcrypt.compare(password, hashedPass)
        if (!checkFlag) return reply.code(400).send({ error: "invalid username or password" })
        return reply.code(200).send({ success: "login successful" })

    } catch (err) {

        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }
}
