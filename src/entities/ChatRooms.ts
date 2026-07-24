import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Column, CreateDateColumn, Entity, ManyToMany, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Chats } from "./Chats";
import { RoomParticipants } from "./RoomParticipants";
import { Users } from "./Users";
import { DmChatRooms } from "./DmChatRooms";
import { SharedspaceChatRooms } from "./SharedspaceChatRooms";

@Entity({ name: 'chatrooms' })
export class ChatRooms {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'varchar', name: 'name', length: 30, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 30 })
  type: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @OneToOne(() => SharedspaceChatRooms, sharedspaceChatRooms => sharedspaceChatRooms.ChatRoom)
  SharedspaceChatRoom: SharedspaceChatRooms;

  @OneToOne(() => DmChatRooms, dmChatRooms => dmChatRooms.ChatRoom)
  DmChatRoom: DmChatRooms;

  @OneToMany(() => Chats, chats => chats.ChatRoom)
  Chats: Chats[];

  @OneToMany(() => RoomParticipants, roomParticipants => roomParticipants.ChatRoom)
  RoomParticipants: RoomParticipants[];

  @ManyToMany(() => Users, users => users.ChatRooms)
  Participants: Users[];
}