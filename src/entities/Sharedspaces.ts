import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Users } from "./Users";
import { Todos } from "./Todos";
import { SharedspaceMembers } from "./SharedspaceMembers";

@Index('sharedspaces_OwnerId_idx', ['OwnerId'])
@Unique('sharedspaces_name_idx', ['name'])
@Unique('sharedspaces_url_idx', ['url'])
@Entity({ name: 'sharedspaces' })
export class Sharedspaces {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'varchar', name: 'name', length: 30 })
  name: string;

  @Column({ type: 'varchar', name: 'url', length: 5 })
  url: string;

  @Column({ type: 'boolean', default: 1 })
  private: boolean;

  @CreateDateColumn()
  createdAt: Date;
  
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

  @OneToMany(() => SharedspaceMembers, sharedspaceMembers => sharedspaceMembers.Sharedspace)
  Sharedspacemembers: SharedspaceMembers[];

  @ManyToMany(() => Users, users => users.Sharedspaces)
  Members: Users[];
}