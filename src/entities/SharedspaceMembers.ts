import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";
import { Roles } from "./Roles";

@Entity({ name: 'sharedspacemembers' })
export class SharedspaceMembers {

  @PrimaryColumn({ type: 'int', name: 'UserId' })
  UserId: number;

  @PrimaryColumn({ type: 'int', name: 'SharedspaceId' })
  SharedspaceId: number;

  @Column({ type: 'varchar', name: 'RoleId' })
  RoleId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

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
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'SharedspaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'sharedspacemembers_SharedspaceId_fk'
  })
  Sharedspace: Sharedspaces;

  @ManyToOne(() => Roles, roles => roles.SharedspaceMembers, {
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'RoleId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'sharedspacemembers_RoleId_fk'
  })
  Role: Roles;
}