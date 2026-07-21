import { BadRequestException, ConflictException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export type FormFieldErrors = Record<string, string>;

const response = (statusCode: number, error: string, field: string, message: string) => ({
  statusCode,
  error,
  message,
  fieldErrors: { [field]: message }
});

export class FormFieldConflictException extends ConflictException {
  constructor(field: string, message: string) {
    super(response(409, 'Conflict', field, message));
  }
}

export class FormFieldBadRequestException extends BadRequestException {
  constructor(field: string, message: string) {
    super(response(400, 'Bad Request', field, message));
  }
}

const collectValidationErrors = (errors: ValidationError[], result: FormFieldErrors = {}): FormFieldErrors => {
  for (const validationError of errors) {
    const messages = Object.values(validationError.constraints ?? {});
    if (messages.length) result[validationError.property] = messages.join(' ');
    if (validationError.children?.length) collectValidationErrors(validationError.children, result);
  }
  return result;
};

export const createFormValidationException = (errors: ValidationError[]): BadRequestException => {
  const fieldErrors = collectValidationErrors(errors);
  const messages = Object.values(fieldErrors);
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message: messages.length ? messages : 'Dados cadastrais invalidos.',
    fieldErrors
  });
};
