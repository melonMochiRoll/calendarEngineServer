import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";

@Index('todos_AuthorId_idx', ['AuthorId'])
@Index('todos_date_idx', ['date'])
@Index('todos_SharedspaceId_idx', ['SharedspaceId'])
@Entity({ name: 'todos' })
export class Todos {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'boolean', default: 0 })
  isComplete: boolean;

  @Column({ type: 'date', name: 'date' })
  date: Date;

  @Column({ type: 'time' })
  startTime: Date;

  @Column({ type: 'time' })
  endTime: Date;

  @Column({ type: 'int', name: 'AuthorId', nullable: true })
  AuthorId: number | null;

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