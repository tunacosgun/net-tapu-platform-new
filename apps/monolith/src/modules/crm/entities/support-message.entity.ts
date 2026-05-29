import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ schema: 'crm', name: 'support_messages' })
export class SupportMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'ticket_id', type: 'uuid' })
  ticketId!: string;

  @Column({ name: 'sender_id', type: 'uuid', nullable: true })
  senderId!: string | null;

  /** 'user' | 'admin' | 'system' | 'consultant' */
  @Column({ name: 'sender_role', type: 'varchar', length: 20 })
  senderRole!: string;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ name: 'attachment_url', type: 'text', nullable: true })
  attachmentUrl!: string | null;

  @Column({ name: 'attachment_type', type: 'varchar', length: 50, nullable: true })
  attachmentType!: string | null;

  @Column({ name: 'attachment_name', type: 'varchar', length: 255, nullable: true })
  attachmentName!: string | null;

  @Column({ name: 'attachment_size', type: 'int', nullable: true })
  attachmentSize!: number | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
