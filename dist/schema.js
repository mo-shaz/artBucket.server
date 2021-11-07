"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterSchema = void 0;
var typebox_1 = require("@sinclair/typebox");
///////////////////////////////////////////////////////
//                  REGISTER USER                   //
/////////////////////////////////////////////////////
// TypeBox Schema
var registerSchema = typebox_1.Type.Object({
    userName: typebox_1.Type.String({ minLength: 4, maxLength: 32 }),
    email: typebox_1.Type.String({ format: 'email' }),
    title: typebox_1.Type.String({ minLength: 4, maxLenght: 32 }),
    storeName: typebox_1.Type.String({ minLength: 4, maxLenght: 32 }),
    pass: typebox_1.Type.String({ minLenght: 8, maxLength: 32 }),
    confirmPass: typebox_1.Type.String({ minLenght: 8, maxLength: 32 })
}, { additionalProperties: false });
// Fastify Route Schema
var RegisterSchema = {
    schema: {
        body: registerSchema,
        response: {
            200: registerSchema
        }
    }
};
exports.RegisterSchema = RegisterSchema;
