import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { ChatImages } from "./ChatImages";
import { ChatRooms } from "./ChatRooms";

@Entity({ name: 'chats' })
export class Chats {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'binary', name: 'SenderId', length: 16, transformer: new UUIDV7Transformer() })
  SenderId: string;

  @Column({ type: 'binary', name: 'RoomId', length: 16, transformer: new UUIDV7Transformer() })
  RoomId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @OneToMany(() => ChatImages, chatImages => chatImages.Chat)
  ChatImages: ChatImages[];

  @Index('chats_SenderId_fk_idx')
  @ManyToOne(() => Users, users => users.Todos)
  @JoinColumn({
    name: 'SenderId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'chats_SenderId_fk',
  })
  Sender: Users;

  @Index('chats_RoomId_fk_idx')
  @ManyToOne(() => ChatRooms, chatRooms => chatRooms.Chats)
  @JoinColumn({
    name: 'RoomId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'chats_RoomId_fk',
  })
  ChatRoom: ChatRooms;
}