import Joi from "joi";

export const loginSchema = Joi.object({
    email:Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['br', 'com', 'net'] } }).required(),
    password:Joi.string().min(3).required()
})

export const signUpSchema = Joi.object({
    name:Joi.string().required(),
    email:Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['br', 'com', 'net'] } }).required(),
    password:Joi.string().min(3).required()
})