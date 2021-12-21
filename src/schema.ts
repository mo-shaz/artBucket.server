import { Static, Type } from '@sinclair/typebox'


//////////////////////
// Utility Schemas //
////////////////////

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
const joinSchema = Type.Object({
    emailInvite: Type.String({ minLength: 4, maxLength: 32 })
}, { additionalProperties: false })

// Fastify Route Schema
export const JoinSchema = {
    schema: {
        body: joinSchema,
        response: {
            200: joinSchema,
            400: naySchema,
            500: naySchema
        }
    }
}

// TypeScript Type
export type JoinType = Static<typeof joinSchema>




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



/////////////////////////////////////////////////////
//                      INDEX                     // 
///////////////////////////////////////////////////

// Fastify Schema
export const IndexSchema = {
    schema: {
        response: {
            200: yaySchema,
            400: naySchema,
            500: naySchema
        }
    }
}

/////////////////////////////////////////////////////
//                    DASHBOARD                   // 
///////////////////////////////////////////////////

// TypeBox Schemas
const dashSchema = Type.Object({
    success: Type.Object({
        id: Type.Number(),
        userName: Type.String({ minLength: 3, maxLenght: 32 }),
        storeName: Type.String({ minLength:3, maxLength: 32 }),
        title: Type.Optional(Type.String({ maxLength: 32 })),
        whatsapp: Type.String({ minLenght: 8, maxLength: 15 }),
        instagram: Type.String({ minLength: 3, maxLength: 32 }),
        profile: Type.String(),
        products: Type.Array(Type.Object({ id: Type.Number(), image: Type.String() }))
    }, { additionalProperties: false }) 
}, { additionalProperties: false })

// Fastify Route Schema
export const DashSchema = {
    schema: {
        response: {
            200: dashSchema,
            400: naySchema,
            500: naySchema
        }
    }
}


/////////////////////////////////////////////////////
//                      LOGOUT                    // 
///////////////////////////////////////////////////

// Fastify Route Schema
export const LogoutSchema = {
    schema: {
        response: {
            200: yaySchema,
            400: naySchema,
            500: naySchema
        }
    }
}


///////////////////////////////////////////////////
//                  INVITE USER                 //
/////////////////////////////////////////////////

// TypeBox Schema
const inviteSchema = Type.Object({
    inviteEmail: Type.String({ format: 'email' }),
    invitedBy: Type.String({ minLength: 3, maxLength: 32 })
}, { additionalProperties: false })

// Fastify Route Schema
export const InviteSchema = {
    schema: {
        body: inviteSchema,
        response: {
            200: yaySchema,
            400: naySchema,
            500: naySchema
        }
    }
}

// TypeScript Type
export type InviteType = Static<typeof inviteSchema>



///////////////////////////////////////////////////
//                  EDIT PROFILE                //
/////////////////////////////////////////////////
 
// TypeBox Schema
const profileSchema = Type.Object({
    userName: Type.String({ minLength: 3, maxLength: 32 }),
    storeName: Type.String({ minLength: 3, maxLength: 32 }),
    title: Type.String({ minLength: 3, maxLength: 32 }),
    whatsapp: Type.String({ minLength: 4, maxLength: 15 }),
    instagram: Type.String({ minLength: 3, maxLength: 32 })
})

// Fastify Route Schema
export const ProfileSchema = {
    schema: {
        body: profileSchema,
        response: {
            200: yaySchema,
            201: { success: profileSchema },
            400: naySchema,
            500: naySchema
        }
    }
}

// TypeScript Type
export type ProfileType = Static<typeof profileSchema>
