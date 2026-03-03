export type Category = 'Science' | 'History' | 'Etymology' | 'Space' | 'Art' | 'Us' | 'Random';

export type ReactionType = 'mind-blown' | 'fascinating' | 'heart' | 'laugh' | 'thinking' | 'sad';

export type Fact = {
  id: string;
  text: string;
  authorId: string;
  pairingId: string;
  date: string;
  categories: Category[];
  reactions: Record<string, ReactionType | null>;
};

export type User = {
  id: string;
  name: string;
  avatar: string;
};

export type AuthState = {
  user: User;
  pairing: { id: string; inviteCode: string } | null;
  partner: User | null;
};
