import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";

@Index('invites_createdAt_idx', ['createdAt'])
@Entity({ name: 'invites' })
export class Invites {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'int', name: 'SharedspaceId' })
  SharedspaceId: number;

  @Column({ type: 'int', name: 'InviterId' })
  InviterId: number;

  @Column({ type: 'int', name: 'InviteeId' })
  InviteeId: number;

  @Column({ type: 'varchar', name: 'status', length: 10, default: 'PENDING' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', precision: 6 })
  expiredAt: Date;

  @ManyToOne(() => Users, users => users.SentInvites, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'InviterId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'invites_InviterId_fk'
  })
  Inviter: Users;

  @ManyToOne(() => Users, users => users.ReceivedInvites, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'InviteeId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'invites_InviteeId_fk'
  })
  Invitee: Users;

  @ManyToOne(() => Sharedspaces, sharedspaces => sharedspaces.Invites, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'SharedspaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'invites_SharedspaceId_fk'
  })
  Sharedspace: Sharedspaces;
}