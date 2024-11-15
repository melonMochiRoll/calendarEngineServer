import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Todos } from "./Todos";
import { SharedspaceMembers } from "./SharedspaceMembers";
import { JoinRequests } from "./JoinRequests";

@Index('sharedspaces_OwnerId_idx', ['OwnerId'])
@Unique('sharedspaces_url_idx', ['url'])
@Entity({ name: 'sharedspaces' })
export class Sharedspaces {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'varchar', name: 'name', length: 30, default: '새 스페이스' })
  name: string;

  @Column({ type: 'varchar', name: 'url', length: 5 })
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
    cascade: ['update', 'soft-remove', 'recover'],
  })
  Sharedspacemembers: SharedspaceMembers[];

  @OneToMany(() => JoinRequests, joinRequests => joinRequests.Sharedspace, {
    cascade: ['update', 'soft-remove', 'recover'],
  })
  JoinRequests: JoinRequests[];

  @ManyToMany(() => Users, users => users.Sharedspaces)
  Members: Users[];
}