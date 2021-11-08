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
	pass: Type.String({ minLenght: 8, maxLength: 32 }),
	confirmPass: Type.String({ minLenght: 8, maxLength: 32 })
}, { additionalProperties: false })

// Fastify Route Schema
const RegisterSchema: object = {
    schema: {
        body: registerSchema,
        response: {
            200: registerSchema
        }
    }
}

// Type
type RegisterType = Static<typeof registerSchema>












///////////////////////////////////////////////////
//                  EXPORTS                     //
/////////////////////////////////////////////////

export {
    RegisterSchema, RegisterType
}
