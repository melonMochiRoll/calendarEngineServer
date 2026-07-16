import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Spaces } from "./Spaces";

@Entity({ name: 'chatspaces' })
export class ChatSpaces {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'varchar', name: 'name', length: 30, nullable: true })
  name: string | null;

  @OneToOne(() => Spaces, spaces => spaces.Chatspace, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'chatspaces_id_fk'
  })
  Space: Spaces;
}