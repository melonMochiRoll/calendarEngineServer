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

@ValidatorConstraint({ name: 'isExistTodo', async: true })
@Injectable()
export class IsExistTodoConstraint implements ValidatorConstraintInterface {
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

export function IsExistTodo(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsExistTodoConstraint,
    });
  };
}