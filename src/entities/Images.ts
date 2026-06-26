import { Column, CreateDateColumn, Entity, Index, OneToOne, PrimaryColumn } from "typeorm";
import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { ChatImages } from "./ChatImages";
import { ProfileImages } from "./ProfileImages";

@Index('images_createdAt_idx', ['createdAt'])
@Entity({ name: 'images' })
export class Images {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'varchar', name: 'status', length: 30, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 30 })
  type: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @OneToOne(() => ChatImages, chatImages => chatImages.Image)
  ChatImage: ChatImages;

  @OneToOne(() => ProfileImages, profileImages => profileImages.Image)
  ProfileImage: ProfileImages;
}