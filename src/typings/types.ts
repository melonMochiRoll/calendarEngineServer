import { Todos } from "src/entities/Todos";
import { Users } from "src/entities/Users";

export type UserWithoutPassword = Pick<Users, 'id' | 'email' | 'createdAt' | 'deletedAt'>;

export type TodosWithoutUserId = Pick<Todos, 'id' | 'contents' | 'isComplete' | 'date'>;

type ProcessedTodo = Pick<Todos, 'id' | 'contents' | 'isComplete'>;

export type ProcessedTodos = {
  [key: string]: ProcessedTodo[],
};