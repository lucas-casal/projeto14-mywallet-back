import Joi from "joi"

export const newTransactionSchema = Joi.object({
    value: Joi.number().positive().required(),
    description: Joi.string().required()
})