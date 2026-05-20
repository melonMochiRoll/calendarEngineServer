import { UUIDV7Transformer } from "src/common/function/uuidv7Transformer";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from "typeorm";
import { Chats } from "./Chats";
import { Images } from "./Images";

@Entity({ name: 'chatimages' })
export class ChatImages {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'binary', name: 'ChatId', length: 16, transformer: new UUIDV7Transformer() })
  ChatId: string;

  @ManyToOne(() => Chats, chats => chats.ChatImages)
  @JoinColumn({
    name: 'ChatId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'images_ChatId_fk',
  })
  Chat: Chats;

  @OneToOne(() => Images, images => images.ChatImage, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'id',
    referencedColumnName: 'id',
  })
  Image: Images;
}