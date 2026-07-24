import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { ChatRooms } from "./ChatRooms";

@Entity({ name: 'dm_chatrooms' })
export class DmChatRooms {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @OneToOne(() => ChatRooms, chatRooms => chatRooms.DmChatRoom)
  @JoinColumn({
    name: 'id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'dm_chatrooms_id_fk',
  })
  ChatRoom: ChatRooms;
}