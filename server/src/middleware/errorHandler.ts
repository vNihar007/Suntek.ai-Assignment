import type { NextFunction, Request , Response  } from "express";
import { ZodError } from "zod";

export function errorHandler(err:unknown , _req:Request , res:Response , _next:NextFunction){
    if (err instanceof ZodError){
        res.status(400).json({success:false , error : err.issues[0]?.message ?? 'Validation Error '})
        return 
    }

    const message  = err instanceof Error ? err.message :"Internal server error"
    const status = (err as any).status ?? 500
    res.status(status).json({success:false,error:message})
}


