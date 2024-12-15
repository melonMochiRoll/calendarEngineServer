import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";

@Entity({ name: 'chats' })
export class Chats {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', name: 'SenderId', nullable: true })
  SenderId: number | null;

  @Column({ type: 'int', name: 'SharedspaceId' })
  SharedspaceId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => Users, users => users.Todos, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'SenderId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'chats_SenderId_fk',
  })
  Sender: Users;

  @ManyToOne(() => Sharedspaces, sharedspaces => sharedspaces.Chats, {
    onUpdate: 'CASCADE',
    orphanedRowAction: 'soft-delete',
  })
  @JoinColumn({
    name: 'SharedspaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'chats_SharedspaceId_fk',
  })
  Sharedspace: Sharedspaces;
}