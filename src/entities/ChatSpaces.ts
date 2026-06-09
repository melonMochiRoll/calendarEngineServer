import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Spaces } from "./Spaces";

@Entity({ name: 'chatspaces' })
export class ChatSpaces {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @OneToOne(() => Spaces, spaces => spaces.Chatspace, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'id',
    referencedColumnName: 'id',
  })
  Space: Spaces;
}