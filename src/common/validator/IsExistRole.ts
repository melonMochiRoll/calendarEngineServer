import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { SharedspaceMembersRoles } from 'src/typings/types';

@ValidatorConstraint({ name: 'isExistRole', async: false })
@Injectable()
export class IsExistRoleConstraint implements ValidatorConstraintInterface {
  constructor() {}

  async validate(roleName: string, args: ValidationArguments) {
    return Object.keys(SharedspaceMembersRoles).includes(roleName);
  }
}

export function IsExistRole(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsExistRoleConstraint,
    });
  };
}