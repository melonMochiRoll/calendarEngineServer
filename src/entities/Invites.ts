import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";
import { INVITE_STATUS } from "src/common/constant/constants";

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

  @Column({ type: 'varchar', name: 'status', length: 15, default: INVITE_STATUS.PENDING })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @Column({ type: 'datetime', precision: 6 })
  expiredAt: Date;

  @ManyToOne(() => Users, users => users.SentInvites, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'InviterId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'invites_InviterId_fk'
  })
  Inviter: Users;

  @ManyToOne(() => Users, users => users.ReceivedInvites, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
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