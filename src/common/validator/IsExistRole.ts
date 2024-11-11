import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles } from 'src/entities/Roles';

@ValidatorConstraint({ name: 'isExistRole', async: true })
@Injectable()
export class IsExistRoleConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Roles)
    private rolesRepository: Repository<Roles>,
  ) {}

  async validate(roleName: string, args: ValidationArguments) {
    return await this.rolesRepository.findOneByOrFail({ name: roleName })
      .then(() => true)
      .catch(() => false);
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