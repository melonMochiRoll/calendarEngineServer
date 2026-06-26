import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Users } from "./Users";
import { Images } from "./Images";
import { ImagePathTransformer } from "src/common/transformer/imagePathTransformer";

@Entity({ name: 'profileimages' })
export class ProfileImages {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'text', transformer: new ImagePathTransformer() })
  path: string;

  @Column({ type: 'binary', name: 'UserId', length: 16, transformer: new UUIDV7Transformer() })
  UserId: string;

  @OneToOne(() => Users, users => users.ProfileImage)
  @JoinColumn({
    name: 'UserId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'profileimages_UserId_fk'
  })
  User: Users;

  @OneToOne(() => Images, images => images.ProfileImage, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'id',
    referencedColumnName: 'id',
  })
  Image: Images;
}