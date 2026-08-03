import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsTimeFormatConstraint implements ValidatorConstraintInterface {
  private timeFormatRexExp = /^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;

  validate(value: any, args: ValidationArguments) {
    return typeof value === 'string' && this.timeFormatRexExp.test(value);
  }
}

export function IsTimeFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsTimeFormatConstraint,
    });
  };
}