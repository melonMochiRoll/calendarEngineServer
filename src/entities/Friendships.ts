import { FRIENDSHIPS_STATUS } from "src/common/constant/constants";
import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";

@Index('friendships_RequesterId_RequesteeId_uq_idx', ['RequesterId', 'RequesteeId'], { unique: true })
@Entity({ name: 'friendships' })
export class Friendships {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'binary', name: 'RequesterId', length: 16, transformer: new UUIDV7Transformer() })
  RequesterId: string;

  @Column({ type: 'binary', name: 'RequesteeId', length: 16, transformer: new UUIDV7Transformer() })
  RequesteeId: string;

  @Column({ type: 'varchar', name: 'status', length: 15, default: FRIENDSHIPS_STATUS.PENDING })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index('friendships_RequesterId_fk_idx')
  @ManyToOne(() => Users, users => users.SentFriendships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'RequesterId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'friendships_RequesterId_fk'
  })
  Requester: Users;

  @Index('friendships_RequesteeId_fk_idx')
  @ManyToOne(() => Users, users => users.ReceivedFriendships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'RequesteeId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'friendships_RequesteeId_fk'
  })
  Requestee: Users;
}