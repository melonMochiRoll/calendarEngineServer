import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";
import { INVITE_STATUS } from "src/common/constant/constants";
import { UUIDV7Transformer } from "src/common/function/uuidv7Transformer";

@Index('invites_createdAt_idx', ['createdAt'])
@Entity({ name: 'invites' })
export class Invites {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'binary', name: 'SharedspaceId', length: 16, transformer: new UUIDV7Transformer() })
  SharedspaceId: string;

  @Column({ type: 'binary', name: 'InviterId', length: 16, transformer: new UUIDV7Transformer() })
  InviterId: string;

  @Column({ type: 'binary', name: 'InviteeId', length: 16, transformer: new UUIDV7Transformer() })
  InviteeId: string;

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