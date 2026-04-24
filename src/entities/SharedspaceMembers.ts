import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";
import { Roles } from "./Roles";
import { UUIDV7Transformer } from "src/common/function/uuidv7Transformer";

@Index('sharedspacemembers_createdAt_idx', ['createdAt'])
@Entity({ name: 'sharedspacemembers' })
export class SharedspaceMembers {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'binary', name: 'UserId', length: 16, transformer: new UUIDV7Transformer() })
  UserId: string;

  @Column({ type: 'binary', name: 'SharedspaceId', length: 16, transformer: new UUIDV7Transformer() })
  SharedspaceId: string;

  @Column({ type: 'int', name: 'RoleId' })
  RoleId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @ManyToOne(() => Users, users => users.Sharedspacemembers, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'UserId',
    referencedColumnName: 'id',
  })
  User: Users;

  @ManyToOne(() => Sharedspaces, sharedspace => sharedspace.Sharedspacemembers, {
    onUpdate: 'CASCADE',
    orphanedRowAction: 'soft-delete',
  })
  @JoinColumn({
    name: 'SharedspaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'sharedspacemembers_SharedspaceId_fk'
  })
  Sharedspace: Sharedspaces;

  @ManyToOne(() => Roles, roles => roles.SharedspaceMembers, {
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'RoleId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'sharedspacemembers_RoleId_fk'
  })
  Role: Roles;
}