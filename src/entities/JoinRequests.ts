import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";
import { JOINREQUEST_STATUS } from "src/common/constant/constants";
import { UUIDV7Transformer } from "src/common/function/uuidv7Transformer";

@Index('joinrequests_createdAt_idx', ['createdAt'])
@Entity({ name: 'joinrequests' })
export class JoinRequests {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'binary', name: 'SharedspaceId', length: 16, transformer: new UUIDV7Transformer() })
  SharedspaceId: string;

  @Column({ type: 'binary', name: 'RequestorId', length: 16, nullable: true, transformer: new UUIDV7Transformer() })
  RequestorId: string | null;

  @Column({ type: 'varchar', name: 'status', length: 15, default: JOINREQUEST_STATUS.PENDING })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @Column({ type: 'text' })
  message: string;

  @ManyToOne(() => Sharedspaces, sharedspaces => sharedspaces.JoinRequests, {
    onUpdate: 'CASCADE',
    orphanedRowAction: 'soft-delete',
  })
  @JoinColumn({
    name: 'SharedspaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'joinrequests_SharedspaceId_fk'
  })
  Sharedspace: Sharedspaces;

  @ManyToOne(() => Users, users => users.JoinRequests, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'RequestorId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'joinrequests_RequestorId_fk'
  })
  Requestor: Users;
}