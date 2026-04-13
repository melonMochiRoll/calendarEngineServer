import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'batchScheduler' })
export class BatchScheduler {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'varchar', name: 'job_name', length: 40 })
  job_name: string;

  @Column({ type: 'text', name: 'job_params' })
  job_params: string;

  @Column({ type: 'varchar', name: 'status', length: 30 })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}