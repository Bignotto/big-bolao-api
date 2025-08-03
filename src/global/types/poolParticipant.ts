import { $Enums } from '@prisma/client';

export interface PoolParticipant {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl: string | null;
  createdAt: Date;
  lastLogin: Date | null;
  accountProvider: $Enums.AccountProvider | null;
  role: $Enums.AccountRole | null;
  joinedAt: Date | null;
  isOwner: boolean;
}
