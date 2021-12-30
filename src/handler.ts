import {FastifyReply, FastifyRequest} from "fastify"
import bcrypt from "bcrypt"
import mailer from "nodemailer"
import cloudinary from "cloudinary"


import { dbPool } from "./server"
import { RegisterType, JoinType, LoginType, InviteType, ProfileType, ProductType, ProductParamsType, StoreParamsType, ConnectParamsType } from "./schema"


///////////////////////////////////
//      UTILITY FUNCTIONS       //
/////////////////////////////////

// additional request body interface
interface ImageUploadRequest extends FastifyRequest {
    body: {
        productId: number;
        profileId: number;
    }
}

// function that changes the file-name of the image according to the user
export const getFileName = async (req: ImageUploadRequest) => {
    
    req.body

    // the file-name to be returned
    let fileName: string

    // if it is a profile picture
    if (req.body.profileId) {
        
        const theId = req.body.profileId

        // construct the file-name
        fileName = `profile_${theId}`
    
    } else if (req.body.productId) {

        const theId = req.body.productId
        fileName = `product_${theId}`

    } else {

        return 'aCuriousGuy'
    }

    return fileName
}

// Function that gets the cloudinary public_id from the image url
const getPublicId = (str: string): string => {

    // split the url 
    const splitString = str.split('/')
    const theLength = splitString.length

    // get rid of the file extension
    const fullFileName = splitString[theLength-1]
    const fileNameSplit = fullFileName.split('.')
    const fileName = fileNameSplit[0]

    // the folderName ofcourse
    const folderName = splitString[theLength-2]

    // construct the publicId
    const publicId = `${folderName}/${fileName}`

    return publicId
}


///////////////////////////////////////////////////////////////
//                      REGISTER A USER                     //
/////////////////////////////////////////////////////////////

export const registerHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {

        let { userName, email, title, storeName, password, confirmPassword } = (req.body as RegisterType)
        
        // trim whitespaces from start and end
        userName = userName.trim()
        email = email.trim()
        title = title.trim()
        storeName = storeName.trim()
        password = password.trim()

        // Check if password and confirm-password fields match
        // Already do this on the client side, just to make sure    
        if (password !== confirmPassword) return reply.code(400).send({ error: 'Passwords do not match' })

        // Grab a client from the dbPool (this is good for performance reasons)
        const client = await dbPool.connect()

        // Check if the email is already registered
        const emailQuery = await client.query('SELECT EXISTS(SELECT 1 FROM creators WHERE email=$1);', [email])

        if (emailQuery.rows[0].exists === true) {
            // release the client [IMPORTANT]
            client.release()

            return reply.code(400).send({ error: `user with email '${email}' already exists` })
        }
        
        // Check storeName availability
        const storeQuery = await client.query('SELECT EXISTS(SELECT 1 FROM creators WHERE store_name=$1);', [storeName])

        if (storeQuery.rows[0].exists === true) {
            // release the client [IMPORTANT]
            client.release()

            return reply.code(400).send({ error: `the storename '${storeName}' is already taken` })
        }

        // If everything checks out, insert a new user into the database
        // Before inserting data into databse, hash the password
        const hashedPass = await bcrypt.hash(password, 10)

        // Additional Generic Details (Placeholders)
        const profile = "https://res.cloudinary.com/artistsadmin/image/upload/v1640628397/generic-profile.png"
        const whatsapp = "----"
        const instagram = "----"

        const response = await client.query('INSERT INTO creators(user_name, email, store_name, title, hashed_pass, profile, whatsapp, instagram) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;', [userName, email, storeName, title, hashedPass, profile, whatsapp, instagram])

        // Also update the admin table for creatorCount
        await client.query('UPDATE admin SET count=count+1 WHERE table_name=$1;', ["creator_table"])

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

        // Get the number of creators and products from the admin table
        const creatorCountQuery = await dbPool.query('SELECT count FROM admin WHERE table_name=$1;', ["creator_table"])
        const productCountQuery = await dbPool.query('SELECT count FROM admin WHERE table_name=$1;', ["product_table"])

        const creatorCount = await creatorCountQuery.rows[0]['count']
        const productCount = await productCountQuery.rows[0]['count']

        // construct the response object
        const resData = {
            creatorCount: creatorCount,
            productCount: productCount
        }

        return reply.code(200).send({ success: resData })
        
        
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
        let { emailInvite } = (req.body as JoinType)
        emailInvite = emailInvite.trim()

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
        const emailQuery = await client.query('SELECT EXISTS(SELECT 1 FROM creators WHERE email=$1);', [email])

        if (emailQuery.rows[0].exists === false ) {
            // release the client [IMPORTANT]
            client.release()

            return reply.code(400).send({ error: "invalid email or password" })
        }

        // Check if the password is correct
        // Get the password hash from the DB
        const hashQuery = await client.query('SELECT hashed_pass FROM creators WHERE email=$1;', [email])
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
        await client.query('UPDATE creators SET session_id=$1 WHERE email=$2;', [sessionId, email])

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

        // Get the user details from the database
        const dashQuery = await client.query('SELECT id, user_name, store_name, title, whatsapp, instagram, profile, connections FROM creators WHERE session_id=$1;', [sessionId])
        const data = await dashQuery.rows[0]

        // Get the product list
        const { id } = data
        const productQuery = await client.query('SELECT product_id, image FROM products WHERE store_id=$1;', [id])
        const productList = productQuery.rows

        // Finally, release the client
        client.release()

        // Construct a response data
        const resData = {
            id: data.id,
            userName: data.user_name,
            storeName: data.store_name,
            title: data.title,
            whatsapp: data.whatsapp,
            instagram: data.instagram,
            profile: data.profile,
            connections: data.connections,
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
        let { inviteEmail, invitedBy } = (req.body as InviteType)
        
        // trim inputs
        inviteEmail = inviteEmail.trim()
        invitedBy = invitedBy.trim()

        // check if the email is aleady registered
        const emailQuery = await dbPool.query('SELECT EXISTS(SELECT 1 FROM creators WHERE email=$1);', [inviteEmail])

        // if exists, return a reply
        if (emailQuery.rows[0].exists) return reply.code(400).send({ error: "user is already registered" })

        // Now send the invite e-mail 
        // NodeMailer transport
        const transporter = mailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAILER_USER,
                pass: process.env.MAILER_PASS
            }
        })

        // Generate an ivite code (I just encode the email in base64 :p)
        const code = Buffer.from(`${inviteEmail}`).toString('base64') 

        // The email-text to be send
        const theMessage = `Hello ${inviteEmail}, you got an invite from ${invitedBy} to join artBucket.com. Use this code: ${code} to create an account. Have fun.`

        // The whole mail
        const theMail = {
            from: process.env.MAILER_USER,
            to: inviteEmail,
            subject: 'artBucket invite',
            text: theMessage
        }

        // Send the mail
        const responseFromMailServer = await transporter.sendMail(theMail)
        console.log(responseFromMailServer.response)

        // if everything checks out, send confirmation back
        return reply.code(200).send({ success: "invite send successfully" })

    } catch (err) {

        console.log(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }
}



///////////////////////////////////////////////////////////////////
//                     IMAGE-UPLOAD ENDPOINT                    //
/////////////////////////////////////////////////////////////////

export const imageHandler = async (req: ImageUploadRequest, reply: FastifyReply) => {
    
    try {

        // check if the user is authenticated
        if (!req.session.authenticated) return reply.code(400).send({ error: "UNAUTHORIZED ACCESS" })

        // get the url of the image
        const imageUrl = req.file.path
        const { sessionId } = req.session

        // add the url to the database
        // before adding, check if it is a profile picture or a product image
        
        if (req.body.profileId) {

            await dbPool.query('UPDATE creators SET profile=$1 WHERE session_id=$2;', [imageUrl, sessionId])
            return reply.code(200).send({ success: imageUrl })

        } 

        // if it's a product image, just send back the cloudinary url
        return reply.code(200).send({ success: imageUrl })
        
    } catch (err) {

        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }
}



///////////////////////////////////////////////////////////////////
//                     EDIT-PROFILE ENDPOINT                    //
/////////////////////////////////////////////////////////////////

export const profileHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {

        // check if authenticated
        if (!req.session.authenticated) return reply.code(400).send({ error: "UNAUTHORIZED ACCESS" })
        
        // the sessionId can be used identify the user
        const { sessionId } = req.session

        // req.body surgery
        let { userName, storeName, title, whatsapp, instagram } = (req.body as ProfileType)

        // trim the inputs
        userName = userName.trim()
        storeName = storeName.trim()
        title = title.trim()
        whatsapp = whatsapp.trim()
        instagram = instagram.trim()

        // Activate Pool :O
        const client = await dbPool.connect()

        // check if storeName is already taken
        // the tricky part to avoid the current user, otherwise no updates can take place
        // therefore, here I use the sessionId as the identifier to reduce the database queries
        const storeQuery = await client.query('SELECT session_id FROM creators WHERE store_name=$1;', [storeName])

        // if the sessionId exists and is not the same as the user
        if (storeQuery.rows[0] && storeQuery.rows[0]['session_id'] !== sessionId) {

            // release the beast
            client.release()

            return reply.code(400).send({ error: `the store-name ${storeName} is already taken` })
        }
     
        // No other checks necessary (for now)
        // Add the updated details to the database
        const updateQuery = await client.query('UPDATE creators SET user_name=$1, store_name=$2, title=$3, whatsapp=$4, instagram=$5 WHERE session_id=$6 RETURNING *;', [userName, storeName, title, whatsapp, instagram, sessionId])

        const data = updateQuery.rows[0]

        // construct the return data
        const updatedData = {
            userName: data.user_name,
            storeName: data.store_name,
            title: data.title,
            whatsapp: data.whatsapp,
            instagram: data.instagram
        } 

        // Never forget
        client.release()

        // return the data
        return reply.code(201).send({ success: updatedData })

        
    } catch (err) {

        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }
}




///////////////////////////////////////////////////////////////////
//                     ADD PRODUCT ENDPOINT                     //
/////////////////////////////////////////////////////////////////

export const productHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {

        // check if authenticated
        if (!req.session.authenticated) return reply.code(400).send({ error: "UNAUTHORIZED ACCESS" })
        const { sessionId } = req.session

        // Get the body
        let { name, description, price, image } = (req.body as ProductType)

        // trim inputs
        name = name.trim()
        description = description.trim()
        image = image.trim()

        // Get the userId from the creators table
        const client = await dbPool.connect()

        const userQuery = await client.query('SELECT id FROM creators WHERE session_id=$1;', [sessionId])
        const { id } = userQuery.rows[0]

        // Add the product into the products table
        const addProductQuery = await client.query('INSERT INTO products(product_name, product_description, price, image, store_id) VALUES($1, $2, $3, $4, $5) RETURNING product_id, image;', [name, description, price, image, id])
        const theAddedProduct = await addProductQuery.rows[0]

        // Also update the admin table for productCount
        await client.query('UPDATE admin SET count=count+1 WHERE table_name=$1;', ["product_table"])

        // ALWAYS, RELEASE, DO NOT FORGET
        client.release()
       
        return reply.code(201).send({ success: theAddedProduct })

    } catch (err) {
        
        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }

}




///////////////////////////////////////////////////////////////////
//                     PRODUCT DETAILS ENDPOINT                 //
/////////////////////////////////////////////////////////////////

export const productDetailsHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {

        // the product id in the URL
        const { productId } = (req.params as ProductParamsType)

        // get a connection from the pool
        const client = await dbPool.connect()

        // get the product details from the database
        const productQuery = await client.query('SELECT * FROM products WHERE product_id=$1;', [productId])
        const productData = await productQuery.rows[0]

        // If the store does not exits, return a 400
        if (!productData) return reply.code(400).send({ error: "BAD REQUEST" })

        const { product_name, product_description, image, price, store_id } = productData

        // get the storeName from the database
        const storeQuery = await client.query('SELECT store_name, whatsapp, instagram FROM creators WHERE id=$1;', [store_id])
        const storeData = await storeQuery.rows[0]

        // the storeData
        const storeDetails = {
            name: storeData['store_name'],
            instagram: storeData['instagram'],
            whatsapp: storeData['whatsapp']
        }

        // construct the response object
        const responseData = {
            name: product_name,
            description: product_description,
            image: image,
            price: price,
            storeDetails: storeDetails
        }

        // COME ON MAN  
        client.release()

        return reply.code(200).send({ success: responseData })
         
    } catch (err) {

        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }

}





///////////////////////////////////////////////////////////////////
//                     DELETE PRODUCT ENDPOINT                  //
/////////////////////////////////////////////////////////////////

export const deleteProductHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {

        // check authentication
        if (!req.session.authenticated) return reply.code(400).send({ error: "UNAUTHORIZED ACCESS" })

        // get the sessionId
        const { sessionId } = req.session

        // get the product id from the url params
        const { productId } = (req.params as ProductParamsType)

        // check if the product belongs to the user
        // grab a connection
        const client = await dbPool.connect()

        // get the userId from users table
        const userQuery = await client.query('SELECT id FROM creators WHERE session_id=$1;', [sessionId])
        const sessionUserId = await userQuery.rows[0]['id']

        // check if the products store id and the session-grabbed user id matches
        const storeQuery = await client.query('SELECT store_id FROM products WHERE product_id=$1;', [productId])
        const productUserId = await storeQuery.rows[0]['store_id']

        // if they are not equal, return error
        if (sessionUserId !== productUserId) {
        
            // close the pool and return error
            client.release()    
            return reply.code(400).send({ error: "UNAUTHORIZED ACCESS" })
        } 

        // if alright, delete the product from database
        const deleteQuery = await client.query('DELETE FROM products WHERE product_id=$1 RETURNING product_id, image;', [productId]) 
        const deletedData = await deleteQuery.rows[0]
        const imageUrl = await deleteQuery.rows[0]['image']

        // delete the image from cloudinary
        // for that we need to extract the public id from the imageUrl
        const publicId =  getPublicId(imageUrl)

        cloudinary.v2.uploader.destroy(publicId, (error: any, result: any) => {
            if (error) return console.error("IMAGE DESTROY ERROR", error)
            return console.log("IMAGE DESTROY SUCCESS", result)
        })

        // construct the return data
        const resData = {
            productId: deletedData['product_id']
        }

        // Also update the admin table for productCount
        await client.query('UPDATE admin SET count=count-1 WHERE table_name=$1;', ["product_table"])

        // OFCOURSE MY GUY
        client.release()

        return reply.code(200).send({ success: resData})

    } catch (err) {
        
        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }
}





///////////////////////////////////////////////////////////////////
//                     DELETE PROFILE ENDPOINT                  //
/////////////////////////////////////////////////////////////////

export const deleteProfileHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    
    try {

        // check authentication
        if (!req.session.authenticated) return reply.code(500).send({ error: "UNAUTHORIZED ACCESS" })
        const { sessionId } = req.session

        // First delete the products which he has
        // Pool time
        const client = await dbPool.connect()

        // For that, we need the storeId
        const userQuery = await client.query('SELECT id FROM creators WHERE session_id=$1;', [sessionId])
        const userId = await userQuery.rows[0]['id']

        // Now delete all the products
        const deleteProductsQuery = await client.query('DELETE FROM products WHERE store_id=$1 RETURNING product_id, image;', [userId])
        const deletedProducts = deleteProductsQuery.rows

        // Also update the admin table for productCount
        const deletedCount = deletedProducts.length
        await client.query('UPDATE admin SET count=count-$1 WHERE table_name=$2;', [deletedCount, "product_table"])

        // Now delete the images of the products, for that ...
        // extract the public_id's of images from the returned array
        const publicIds = []

        const theLength = deletedProducts.length
        for (let i = 0; i < theLength; i++) {
            
            // get the imageUrl from the object
            const imageUrl = deletedProducts[i]['image']
            const publicId = getPublicId(imageUrl)

            // push the id to the id's array
            publicIds.push(publicId)

        }

        // Now call the Cloudinary Admin API
        cloudinary.v2.api.delete_resources(publicIds, (error: any, result: any) => {
            if (error) return console.error("BULK DELETE FAILED", error)
            return console.log("BULK DELETE SUCCESS", result)
        })

        // Finally, delete the user from the creators table
        await client.query('DELETE FROM creators WHERE id=$1 RETURNING store_name;', [userId])

        // Also update the admin table for creatorCount
        await client.query('UPDATE admin SET count=count-1 WHERE table_name=$1;', ["creator_table"])

        // CLOSE THE POOL
        client.release()

        return reply.code(200).send({ success: "GoodBye Artist" })

    } catch (err) {

        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }

}





///////////////////////////////////////////////////////////////////
//                       GET PRODUCTS ENDPOINT                  //
/////////////////////////////////////////////////////////////////

export const marketHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {

        // get all the products from the database
        const productsQuery = await dbPool.query('SELECT product_id, product_name, product_description, image, price FROM products;')
        const productsArray = productsQuery.rows

        return reply.code(200).send({ success: productsArray })
        
    } catch (err) {

        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }

}




///////////////////////////////////////////////////////////////////
//                       GET CREATORS ENDPOINT                  //
/////////////////////////////////////////////////////////////////

export const creatorsHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {
        
        // Get all the creators from the database
        const creatorsQuery = await dbPool.query('SELECT id, user_name, title, store_name, profile FROM creators;')
        const creatorsArray = creatorsQuery.rows

        return reply.code(200).send({ success: creatorsArray })
        
    } catch (err) {

        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }

}




///////////////////////////////////////////////////////////////////
//                      STORE DETAILS ENDPOINT                  //
/////////////////////////////////////////////////////////////////

export const storeHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {

        // get the query param
        const { storeName } = (req.params as StoreParamsType)

        // let's db
        const client = await dbPool.connect()

        // get the store details
        const storeQuery = await client.query('SELECT id, user_name, title, profile, whatsapp, instagram FROM creators WHERE store_name=$1;', [storeName])
        const storeData = await storeQuery.rows[0]

        // If the store does not exits, return a 400
        if (!storeData) return reply.code(400).send({ error: "BAD REQUEST" })

        const storeId = storeData['id']

        // get the products
        const productsQuery = await client.query('SELECT product_id, image FROM products WHERE store_id=$1;', [storeId])
        const productsArray = productsQuery.rows

        // construct the response data
        const resData = {
            storeName: storeName,
            userName: storeData['user_name'],
            title: storeData['title'],
            profile: storeData['profile'],
            whatsapp: storeData['whatsapp'],
            instagram: storeData['instagram'],
            products: productsArray
        }

        // FOR THE LOVE OF GOD, DO NOT FORGET THIS
        client.release()

        // send the data
        return reply.code(200).send({ success: resData })
        
    } catch (err) {

        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }

}




///////////////////////////////////////////////////////////////////
//                     CONNECTIONS INCREMENTER                  //
/////////////////////////////////////////////////////////////////

export const connectHandler = async (req: FastifyRequest, reply: FastifyReply) => {

    try {

        // get the query parameter
        const { storeName } = (req.params as ConnectParamsType)

        // Increment the connections column of the creator
        await dbPool.query('UPDATE creators SET connections=connections+1 WHERE store_name=$1;', [storeName])

        // Finally return a success
        return reply.code(200).send({ success: "+1 connection" })
        
    } catch (err) {

        console.error(err)
        return reply.code(500).send({ error: "INTERNAL SERVER ERROR" })
    }

}
