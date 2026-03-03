export type Category = 'Science' | 'History' | 'Etymology' | 'Space' | 'Art' | 'Us' | 'Random';

export type ReactionType = 'mind-blown' | 'fascinating' | 'heart' | 'laugh' | 'thinking' | 'sad';

export type Fact = {
  id: number;
  text: string;
  imageUrl?: string | null;
  authorId: number;
  pairingId: number;
  date: string;
  categories: Category[];
  reactions: Record<string, ReactionType | null>;
};

export type User = {
  id: number;
  name: string;
  avatar: string;
};

export type AuthState = {
  user: User;
  pairing: { id: number; inviteCode: string } | null;
  partner: User | null;
};
