import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";

@Index('todos_createdAt_idx', ['createdAt'])
@Index('todos_date_idx', ['date'])
@Entity({ name: 'todos' })
export class Todos {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

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

  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column({ type: 'int', name: 'AuthorId', nullable: true })
  AuthorId: number | null;

  @Column({ type: 'int', name: 'EditorId', nullable: true })
  EditorId: number | null;

  @Column({ type: 'int', name: 'SharedspaceId' })
  SharedspaceId: number;
  
  @ManyToOne(() => Users, users => users.Todos, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
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