import { Todos } from "src/entities/Todos";

export type TodosWithoutUserId = Omit<Todos, 'AuthorId'>;

type ProcessedTodo = Pick<Todos, 'id' | 'description' | 'isComplete'>;

export type ProcessedTodos = {
  [key: string]: ProcessedTodo[],
};