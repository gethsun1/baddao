import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { createLogger } from '../common/logger';

const logger = createLogger('ErrorFilter');

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.message
                : 'Internal server error';

        // Never expose stack traces in production
        const details =
            process.env.NODE_ENV !== 'production' && exception instanceof Error
                ? exception.stack
                : undefined;

        logger.error(
            { module: 'ErrorFilter', path: request.url, status, err: exception },
            message,
        );

        response.status(status).json({
            code: `HTTP_${status}`,
            message,
            ...(details ? { details } : {}),
        });
    }
}
