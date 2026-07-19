import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";
import { INVITE_STATUS } from "src/common/constant/constants";
import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";

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

  @Index('invites_InviterId_fk_idx')
  @ManyToOne(() => Users, users => users.SentInvites)
  @JoinColumn({
    name: 'InviterId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'invites_InviterId_fk'
  })
  Inviter: Users;

  @Index('invites_InviteeId_fk_idx')
  @ManyToOne(() => Users, users => users.ReceivedInvites)
  @JoinColumn({
    name: 'InviteeId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'invites_InviteeId_fk'
  })
  Invitee: Users;

  @Index('invites_SharedspaceId_fk_idx')
  @ManyToOne(() => Sharedspaces, sharedspaces => sharedspaces.Invites)
  @JoinColumn({
    name: 'SharedspaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'invites_SharedspaceId_fk'
  })
  Sharedspace: Sharedspaces;
}