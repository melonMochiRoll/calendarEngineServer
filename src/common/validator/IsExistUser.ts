import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from 'src/entities/Users';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'isExistUser', async: true })
@Injectable()
export class IsExistUserConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async validate(id: any, args: ValidationArguments) {
    return await this.usersRepository.findOneByOrFail({ id })
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }
}

export function IsExistUser(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsExistUserConstraint,
    });
  };
}