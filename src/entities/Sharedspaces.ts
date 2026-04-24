import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Todos } from "./Todos";
import { SharedspaceMembers } from "./SharedspaceMembers";
import { JoinRequests } from "./JoinRequests";
import { Chats } from "./Chats";
import { Invites } from "./Invites";
import { UUIDV7Transformer } from "src/common/function/uuidv7Transformer";
import { NANOID_SHAREDSPACE_URL_LENGTH } from "src/common/constant/constants";

@Index('sharedspaces_createdAt_idx', ['createdAt'])
@Entity({ name: 'sharedspaces' })
export class Sharedspaces {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'varchar', name: 'name', length: 30, default: '새 스페이스' })
  name: string;

  @Column({ type: 'char', name: 'url', length: NANOID_SHAREDSPACE_URL_LENGTH, unique: true })
  url: string;

  @Column({ type: 'boolean', default: 1 })
  private: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @Column({ type: 'binary', name: 'OwnerId', length: 16, nullable: true, transformer: new UUIDV7Transformer() })
  OwnerId: string | null;

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

  @OneToMany(() => JoinRequests, joinRequests => joinRequests.Sharedspace)
  JoinRequests: JoinRequests[];

  @OneToMany(() => Chats, chats => chats.Sharedspace)
  Chats: Chats[];

  @OneToMany(() => Invites, invites => invites.Sharedspace)
  Invites: Invites[];

  @ManyToMany(() => Users, users => users.Sharedspaces)
  Members: Users[];
}