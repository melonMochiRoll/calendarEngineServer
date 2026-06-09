import { Column, Entity,JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn } from "typeorm";
import { Users } from "./Users";
import { Todos } from "./Todos";
import { JoinRequests } from "./JoinRequests";
import { Invites } from "./Invites";
import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Spaces } from "./Spaces";

@Entity({ name: 'sharedspaces' })
export class Sharedspaces {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'varchar', name: 'name', length: 30, default: '새 스페이스' })
  name: string;

  @Column({ type: 'boolean', default: 1 })
  private: boolean;

  @Column({ type: 'binary', name: 'OwnerId', length: 16, nullable: true, transformer: new UUIDV7Transformer() })
  OwnerId: string | null;

  @OneToOne(() => Spaces, spaces => spaces.Sharedspace, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'id',
    referencedColumnName: 'id',
  })
  Space: Spaces;

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

  @OneToMany(() => JoinRequests, joinRequests => joinRequests.Sharedspace)
  JoinRequests: JoinRequests[];

  @OneToMany(() => Invites, invites => invites.Sharedspace)
  Invites: Invites[];
}