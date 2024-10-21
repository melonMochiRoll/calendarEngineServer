import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { SharedspaceMembersRoles, TSharedspaceMembersRole } from 'src/typings/types';

@ValidatorConstraint({ name: 'isExistRole', async: false })
@Injectable()
export class IsExistRoleConstraint implements ValidatorConstraintInterface {
  constructor() {}

  validate(role: any, args: ValidationArguments): role is TSharedspaceMembersRole {
    return Object.values(SharedspaceMembersRoles).includes(role);
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