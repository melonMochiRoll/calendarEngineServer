import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { ChatRooms } from "./ChatRooms";

@Index('room_participants_UserId_RoomId_uq_idx', ['UserId', 'RoomId'], { unique: true })
@Entity({ name: 'room_participants' })
export class RoomParticipants {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'binary', name: 'UserId', length: 16, transformer: new UUIDV7Transformer() })
  UserId: string;

  @Column({ type: 'binary', name: 'RoomId', length: 16, transformer: new UUIDV7Transformer() })
  RoomId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @Index('room_participants_UserId_fk_idx')
  @ManyToOne(() => Users, users => users.RoomParticipants)
  @JoinColumn({
    name: 'UserId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'room_participants_UserId_fk'
  })
  User: Users;

  @Index('room_participants_RoomId_fk_idx')
  @ManyToOne(() => ChatRooms, chatRooms => chatRooms.RoomParticipants)
  @JoinColumn({
    name: 'RoomId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'room_participants_RoomId_fk'
  })
  ChatRoom: ChatRooms;
}