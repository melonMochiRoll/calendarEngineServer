import { Todos } from "src/entities/Todos";

export type TodosWithoutUserId = Omit<Todos, 'AuthorId'>; // 테이블 구조 변경으로 인한 수정 필요


type ProcessedTodo = Pick<Todos, 'id' | 'description'>; // 테이블 구조 변경으로 인한 수정 필요

export type ProcessedTodos = { // 테이블 구조 변경으로 인한 수정 필요
  [key: string]: ProcessedTodo[],
};

export const enum ESharedspaceMembersRoles {
  OWNER = 'owner',
  MEMBER = 'member',
  VIEWER = 'viewer',
};

export interface IErrorResponse {
  message: string,
  error: string,
  statusCode: number,
}