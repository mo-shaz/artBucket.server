import { Static, Type } from '@sinclair/typebox'


//////////////////////
// Utility Schemas //
// /////////////////

// Success Response
const yaySchema = Type.Object({
    success: Type.String()
}, { additionalProperties: false }) 

// Error Response 
const naySchema = Type.Object({
    error: Type.String()
}, { additionalProperties: false }) 


///////////////////////////////////////////////////////
//                  REGISTER USER                   //
/////////////////////////////////////////////////////

// TypeBox Schema
const registerSchema = Type.Object({
	userName: Type.String({ minLength: 4, maxLength: 32 }),
	email: Type.String({ format: 'email' }),
	title: Type.Optional(Type.String({  maxLenght: 32 })),
	storeName: Type.String({ minLength: 4, maxLenght: 32 }),
	password: Type.String({ minLenght: 8, maxLength: 32 }),
	confirmPassword: Type.String({ minLenght: 8, maxLength: 32 })
}, { additionalProperties: false })

// Fastify Route Schema
export const RegisterSchema: object = {
    schema: {
        body: registerSchema,
        response: {
            201: yaySchema,
            400: naySchema,
            500: naySchema
        }
    }
}

// TypeScript Type
export type RegisterType = Static<typeof registerSchema>


///////////////////////////////////////////////////////
//                  EMAIL INVITE                    //
/////////////////////////////////////////////////////

// TypeBox Schema
const inviteSchema = Type.Object({
    emailInvite: Type.String({ minLength: 4, maxLength: 32 })
}, { additionalProperties: false })

// Fastify Route Schema
export const InviteSchema = {
    schema: {
        body: inviteSchema,
        response: {
            200: inviteSchema,
            400: naySchema,
            500: naySchema
        }
    }
}

// TypeScript Type
export type InviteType = Static<typeof inviteSchema>




///////////////////////////////////////////////////
//                  LOGIN USER                  //
/////////////////////////////////////////////////

// TypeBox Schema
const loginSchema = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8, maxLength: 32 })
}, { additionalProperties: false })

// Fatify Route Schema
export const LoginSchema = {
    schema: {
        body: loginSchema,
        response: {
            200: yaySchema,
            400: naySchema,
            500: naySchema
        }
    }
}

// TypeScript Type
export type LoginType = Static<typeof loginSchema>
