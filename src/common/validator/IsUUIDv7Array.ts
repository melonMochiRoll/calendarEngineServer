import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsUUIDv7ArrayConstraint implements ValidatorConstraintInterface {
  private uuidv7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  validate(values: Array<any>, args: ValidationArguments) {    
    const isUUIDv7 = (value: any) => {
      if (!value || typeof value !== 'string') {
        return false;
      }
      
      return this.uuidv7Regex.test(value);
    };
    
    return Array.isArray(values) && values.every(isUUIDv7);
  }
}

export function IsUUIDv7Array(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUUIDv7ArrayConstraint,
    });
  };
}