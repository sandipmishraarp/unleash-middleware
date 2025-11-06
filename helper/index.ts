import { log } from "console";

export const retryOperation = async (operation: any, operationName: string, maxRetries: number, retryDelayBase: number) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await operation();
           log({ module: 'helper', action: 'retryOperation', ok: true, operationName, attempt, response });
            return response
        } catch (err) {
            if (attempt === maxRetries) {
                log({ module: 'helper', action: 'retryOperation', ok: false, operationName, attempt, err });
                throw err
            }
            const delay = 2000 * Math.pow(2, attempt - 1)
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}