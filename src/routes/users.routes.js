import { Router } from "express";
import { signIn, signOut, signUp } from "../controllers/userControllers.js";
import {loginSchema, signUpSchema} from "../schemas/userSchemas.js";
import { validateSchemas } from "../middlewares/validateSchema.js";

const userRouter = Router()

userRouter.post('/cadastro',validateSchemas(signUpSchema), signUp )
userRouter.post('/',validateSchemas(loginSchema) ,signIn)
userRouter.delete('/home', signOut)

export default userRouter