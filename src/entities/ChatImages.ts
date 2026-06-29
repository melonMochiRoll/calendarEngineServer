import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from "typeorm";
import { Chats } from "./Chats";
import { Images } from "./Images";
import { ImagePathTransformer } from "src/common/transformer/imagePathTransformer";

@Entity({ name: 'chatimages' })
export class ChatImages {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'text', transformer: new ImagePathTransformer() })
  path: string;

  @Column({ type: 'binary', name: 'ChatId', length: 16, transformer: new UUIDV7Transformer() })
  ChatId: string;

  @Index('chatimages_ChatId_fk_idx')
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
    foreignKeyConstraintName: 'chatimages_id_fk',
  })
  Image: Images;
}