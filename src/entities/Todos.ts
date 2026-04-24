import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";
import { UUIDV7Transformer } from "src/common/function/uuidv7Transformer";

@Index('todos_createdAt_idx', ['createdAt'])
@Index('todos_date_idx', ['date'])
@Entity({ name: 'todos' })
export class Todos {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date', name: 'date' })
  date: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @Column({ type: 'binary', name: 'AuthorId', length: 16, transformer: new UUIDV7Transformer() })
  AuthorId: string;

  @Column({ type: 'binary', name: 'EditorId', length: 16, nullable: true, transformer: new UUIDV7Transformer() })
  EditorId: string | null;

  @Column({ type: 'binary', name: 'SharedspaceId', length: 16, transformer: new UUIDV7Transformer() })
  SharedspaceId: string;
  
  @ManyToOne(() => Users, users => users.Todos, {
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'AuthorId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'todos_AuthorId_fk',
  })
  Author: Users;

  @ManyToOne(() => Users, users => users.EditedTodos, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'EditorId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'todos_EditorId_fk',
  })
  Editor: Users;

  @ManyToOne(() => Sharedspaces, sharedspaces => sharedspaces.Todos, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'SharedspaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'todos_SharedspaceId_fk',
  })
  Sharedspace: Sharedspaces;
}