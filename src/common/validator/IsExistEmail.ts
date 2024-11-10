import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from 'src/entities/Users';
import { IsNull, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'isExistEmail', async: true })
@Injectable()
export class IsExistEmailConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async validate(email: any, args: ValidationArguments) {
    return await this.usersRepository.findOneByOrFail({ deletedAt: IsNull(), email })
      .then(() => true)
      .catch(() => false);
  }
}

export function IsExistEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsExistEmailConstraint,
    });
  };
}