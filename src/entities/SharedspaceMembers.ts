import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";
import { Roles } from "./Roles";

@Index('sharedspacemembers_createdAt_idx', ['createdAt'])
@Entity({ name: 'sharedspacemembers' })
export class SharedspaceMembers {

  @PrimaryColumn({ type: 'int', name: 'UserId' })
  UserId: number;

  @PrimaryColumn({ type: 'int', name: 'SharedspaceId' })
  SharedspaceId: number;

  @Column({ type: 'int', name: 'RoleId' })
  RoleId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null; 

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