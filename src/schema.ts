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
	title: Type.String({ minLength:3, maxLenght: 32 }),
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

// TypeBox Schema
const indexResponseSchema = Type.Object({
    success: Type.Object({
        creatorCount: Type.Number(),
        productCount: Type.Number()
    })
})

// Fastify Schema
export const IndexSchema = {
    schema: {
        response: {
            200: indexResponseSchema,
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
        storeName: Type.String({ minLength: 3, maxLength: 32 }),
        title: Type.String({ minLength: 3, maxLength: 32 }),
        whatsapp: Type.String({ minLenght: 8, maxLength: 15 }),
        instagram: Type.String({ minLength: 3, maxLength: 32 }),
        profile: Type.String(),
        connections: Type.Number(),
        products: Type.Array(Type.Object({ product_id: Type.Number(), image: Type.String() }))
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
    whatsapp: Type.String({ minLength: 4, maxLength: 32 }),
    instagram: Type.String({ minLength: 3, maxLength: 32 })
}, { additionalProperties: false })

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



///////////////////////////////////////////////////
//                  ADD PRODUCT                 //
/////////////////////////////////////////////////

// TypeBox Schema
const productSchema = Type.Object({
    image: Type.String({ minLength: 3, maxLength: 128 }),
    name: Type.String({ minLength: 3, maxLength: 32 }),
    description: Type.String({ minLength: 3, maxLength: 128 }),
    price: Type.Number()
}, { additionalProperties: false })

const productResponse = Type.Object({
    success: Type.Object({ product_id: Type.Number(), image: Type.String() })
}, { additionalProperties: false })

// Fastitfy Route Schema
export const ProductSchema = {
    schema: {
        body: productSchema,
        response: {
            201: productResponse,
            400: naySchema,
            500: naySchema
        }
    }
}

// TypeScript Type
export type ProductType = Static<typeof productSchema>




///////////////////////////////////////////////////
//                  PRODUCT DETAILS             //
/////////////////////////////////////////////////

// TypeBox Schema
const productDetailsResponse = Type.Object({
    success: Type.Object({
        name: Type.String({ minLength: 3, maxLength: 32 }),
        description: Type.String({ minLength: 3, maxLength: 128 }),
        image: Type.String({ minLength: 3, maxLength: 128 }),
        price: Type.Number(),
        storeDetails: Type.Object({
            name: Type.String({ minLength: 3, maxLength: 32 }),
            instagram: Type.String({ minLength: 3, maxLength: 32 }),
            whatsapp: Type.String({ minLength: 3, maxLength: 32 })
        })
    }) 
}, { additionalProperties: false })

// Request parameter Schema
const productParams = Type.Object({
    productId: Type.Number()
}, { additionalProperties: false })

// Fastify Route Schema
export const ProductDetailsSchema = {
    schema: {
        params: productParams,
        response: {
            200: productDetailsResponse,
            400: naySchema,
            500: naySchema
        }
    }
}

// TypeScript Type
export type ProductParamsType = Static<typeof productParams>





///////////////////////////////////////////////////
//                  DELETE PRODUCT              //
/////////////////////////////////////////////////

// TypeBox Schema
const deleteProductResponse = Type.Object({
    success: Type.Object({
        productId: Type.Number()
    })
}, { additionalProperties: false })

const deleteProductParams = Type.Object({
    productId: Type.Number()
})

// Fastify Route Schema
export const DeleteProductSchema = {
    schema: {
        params: deleteProductParams,
        response: {
            200: deleteProductResponse,
            400: naySchema,
            500: naySchema
        }
    }
}




///////////////////////////////////////////////////
//                  DELETE PROFILE              //
/////////////////////////////////////////////////

export const DeleteProfileSchema = {
    schema: {
        response: {
            200: yaySchema,
            400: naySchema,
            500: naySchema
        }
    }
}




///////////////////////////////////////////////////
//                  GET PRODUCTS                //
/////////////////////////////////////////////////

// TypeBox Schema
const getProductsResponse = Type.Object({
    success: Type.Array(Type.Object({
        product_id: Type.Number(),
        image: Type.String({ minLength: 3, maxLength: 128 }),
        product_name: Type.String({ minLength: 3, maxLength: 32 }),
        product_description: Type.String({ minLength: 3, maxLength: 128 }),
        price: Type.Number()
    }))
}, { additionalProperties: false })

// Fastify Route Schema
export const MarketSchema = {
    schema: {
        response: {
            200: getProductsResponse,
            400: naySchema,
            500: naySchema
        }
    }
} 




///////////////////////////////////////////////////
//                  GET CREATORS                //
/////////////////////////////////////////////////

// TypeBox Schema
const creatorsResponseSchema = Type.Object({
    success: Type.Array(Type.Object({
        id: Type.Number(),
        user_name: Type.String({ minLength: 3, maxLength: 32 }),
        title: Type.String({ minLength: 3, maxLength: 32 }),
        store_name: Type.String({ minLength: 3, maxLength: 32 }),
        profile: Type.String({ minLength: 3, maxLength:128 })
    }))
}, { additionalProperties: false })

// Fastify Route Schema
export const CreatorsSchema = {
    schema: {
        response: {
            200: creatorsResponseSchema,
            400: naySchema,
            500: naySchema
        }
    }
}




///////////////////////////////////////////////////
//                    GET STORE                 //
/////////////////////////////////////////////////

// TypeBox Schema
const storeResponseSchema = Type.Object({
    success: Type.Object({
        userName: Type.String({ minLength: 3, maxLength: 32 }),
        storeName: Type.String({ minLength: 3, maxLength: 32 }),
        title: Type.String({ minLength: 3, maxLength: 32 }),
        profile: Type.String({ minLength: 3, maxLength: 128 }),
        whatsapp: Type.String({ minLength: 8, maxLength: 15 }),
        instagram: Type.String({ minLength: 3, maxLength: 32 }),
        products: Type.Array(Type.Object({ product_id: Type.Number(), image: Type.String({ minLength:3, maxLength: 128 })}))
    })
}, { additionalProperties: false })

const storeParams = Type.Object({
    storeName: Type.String({ minLength: 3, maxLength: 32 })
}, { additionalProperties: false })

// Fastify Route Schema
export const StoreSchema = {
    schema: {
        params: storeParams,
        response: {
            200: storeResponseSchema,
            400: naySchema,
            500: naySchema
        }
    }
}

// TypeScript Type
export type StoreParamsType = Static<typeof storeParams>
