import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Todos } from "./Todos";
import { SharedspaceMembers } from "./SharedspaceMembers";
import { JoinRequests } from "./JoinRequests";
import { Chats } from "./Chats";

@Index('sharedspaces_createdAt_idx', ['createdAt'])
@Entity({ name: 'sharedspaces' })
export class Sharedspaces {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'varchar', name: 'name', length: 30, default: '새 스페이스' })
  name: string;

  @Column({ type: 'varchar', name: 'url', length: 255, unique: true })
  url: string;

  @Column({ type: 'boolean', default: 1 })
  private: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column({ type: 'int', name: 'OwnerId', nullable: true })
  OwnerId: number | null;

  @ManyToOne(() => Users, users => users.OwnedSharedspaces, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'OwnerId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'sharedspaces_OwnerId_fk'
  })
  Owner: Users;

  @OneToMany(() => Todos, todos => todos.Sharedspace)
  Todos: Todos[];

  @OneToMany(() => SharedspaceMembers, sharedspaceMembers => sharedspaceMembers.Sharedspace, {
    cascade: true,
  })
  Sharedspacemembers: SharedspaceMembers[];

  @OneToMany(() => JoinRequests, joinRequests => joinRequests.Sharedspace, {
    cascade: true,
  })
  JoinRequests: JoinRequests[];

  @OneToMany(() => Chats, chats => chats.Sharedspace, {
    cascade: true,
  })
  Chats: Chats[];

  @ManyToMany(() => Users, users => users.Sharedspaces)
  Members: Users[];
}