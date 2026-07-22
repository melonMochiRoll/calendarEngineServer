import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Chats } from "./Chats";
import { Sharedspaces } from "./Sharedspaces";
import { RoomParticipants } from "./RoomParticipants";
import { Users } from "./Users";

@Entity({ name: 'chatrooms' })
export class ChatRooms {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'varchar', name: 'name', length: 30, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 30 })
  type: string;

  @Column({ type: 'binary', name: 'SharedspaceId', length: 16, transformer: new UUIDV7Transformer(), nullable: true })
  SharedspaceId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @Index('chatrooms_SharedspaceId_fk_idx')
  @ManyToOne(() => Sharedspaces, sharedspaces => sharedspaces.ChatRooms, {
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'SharedspaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'chatrooms_SharedspaceId_fk'
  })
  Sharedspace: Sharedspaces;

  @OneToMany(() => Chats, chats => chats.ChatRoom)
  Chats: Chats[];

  @OneToMany(() => RoomParticipants, roomParticipants => roomParticipants.ChatRoom)
  RoomParticipants: RoomParticipants[];

  @ManyToMany(() => Users, users => users.ChatRooms)
  Participants: Users[];
}