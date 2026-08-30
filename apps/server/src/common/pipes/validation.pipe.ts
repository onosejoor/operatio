import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        console.log(errors);
        const formattedErrors = errors.reduce(
          (acc, error) => {
            acc[error.property] = Object.values(error.constraints || {}).join(
              ', ',
            );
            return acc;
          },
          {} as Record<string, string>,
        );

        const errorMessage = Object.values(formattedErrors).join(', ');

        return new BadRequestException({
          message: errorMessage,
          errors: formattedErrors,
        });
      },
    });
  }
}
