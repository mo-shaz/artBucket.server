import { Static, Type } from '@sinclair/typebox'

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
            200: registerSchema
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
            200: inviteSchema
        }
    }
}

// TypeScript Type
export type InviteType = Static<typeof inviteSchema>








