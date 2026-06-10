import type { NextFunction, Request , Response } from "express";
import {auth} from  '../lib/auth'

declare global {
    namespace Express {
        interface Request {
            user : {
                id : string ;
                email : string ;
                name :string
            }
        }
    }
}

export async function authGuard(req:Request , res:Response , next:NextFunction){
    const session = await auth.api.getSession({headers:req.headers as any })
    if (!session?.user){
        res.status(401).json({success:false,error:'Unauthorized'})
        return 
    }
    req.user  = {id :session.user.id , email:session.user.email ,name:session.user.name}
    next()
}