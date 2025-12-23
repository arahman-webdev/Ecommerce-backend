class AppError extends Error {
    public readonly statusCode: number;

    constructor(statusCode:number,message: string,  statck?:string) {
        super(message)

        this.statusCode = statusCode


        if(statck){
            this.stack = statck
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export default AppError