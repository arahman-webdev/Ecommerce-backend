import jwt, {  JwtPayload, Secret, SignOptions } from "jsonwebtoken"

export const generateToken = (payload:object, secret:Secret, expiresIn:string) =>{
    
    const accessToken = jwt.sign(payload, secret, {
        algorithm:"HS256",
        expiresIn
    } as SignOptions);

    return accessToken

    
}


export const verifyToken = (token:string, secret:Secret)=>{
    return jwt.verify(token, secret)
}