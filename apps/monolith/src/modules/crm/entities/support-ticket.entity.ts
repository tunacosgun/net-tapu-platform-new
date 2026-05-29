import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'crm', name: 'support_tickets' })
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 500 })
  subject!: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status!: 'open' | 'in_progress' | 'waiting_user' | 'closed';

  @Column({ type: 'varchar', length: 30, default: 'direct' })
  source!: 'direct' | 'contact' | 'consultant_application' | 'parcel_inquiry';

  @Column({ name: 'source_ref_id', type: 'uuid', nullable: true })
  sourceRefId!: string | null;

  @Column({ name: 'parcel_id', type: 'uuid', nullable: true })
  parcelId!: string | null;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo!: string | null;

  @Column({ name: 'guest_name', type: 'varchar', length: 255, nullable: true })
  guestName!: string | null;

  @Column({ name: 'guest_email', type: 'varchar', length: 255, nullable: true })
  guestEmail!: string | null;

  @Column({ name: 'guest_phone', type: 'varchar', length: 50, nullable: true })
  guestPhone!: string | null;

  @Column({ name: 'unread_admin', type: 'int', default: 0 })
  unreadAdmin!: number;

  @Column({ name: 'unread_user', type: 'int', default: 0 })
  unreadUser!: number;

  @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
