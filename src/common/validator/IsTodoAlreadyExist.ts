import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Todos } from 'src/entities/Todos';

@ValidatorConstraint({ name: 'isTodoAlreadyExist', async: true })
@Injectable()
export class IsTodoAlreadyExistConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Todos)
    private todosRepository: Repository<Todos>,
  ) {}

  async validate(id: any, args: ValidationArguments) {
    return await this.todosRepository.findOneByOrFail({ id })
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }
}

export function IsTodoAlreadyExist(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsTodoAlreadyExistConstraint,
    });
  };
}