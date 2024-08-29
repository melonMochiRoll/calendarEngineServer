import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { Injectable } from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ name: 'isSpaceAlreadyExist', async: true })
export class IsSpaceAlreadyExistConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
  ) {}

  async validate(id: any, args: ValidationArguments) {
    return await this.sharedspacesRepository.findOneByOrFail({ id })
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }
}

export function IsSpaceAlreadyExist(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSpaceAlreadyExistConstraint,
    });
  };
}