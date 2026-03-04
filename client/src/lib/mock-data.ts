export type Category = 'Science' | 'History' | 'Etymology' | 'Space' | 'Art' | 'Us' | 'Random';

export type ReactionType = 'mind-blown' | 'fascinating' | 'heart' | 'laugh' | 'thinking' | 'sad';

export type Fact = {
  id: string;
  text: string;
  authorId: string;
  pairingId: string;
  date: string;
  categories: Category[];
  reactions: Record<string, ReactionType>;
};

export type User = {
  id: string;
  name: string;
  avatar: string;
};

export type DailyAnswer = {
  id: string;
  pairingId: string;
  date: string;
  questionText: string;
  category: string;
  answers: Record<string, string>;
  reactions: Record<string, ReactionType>;
};

export type AuthState = {
  user: User;
  pairing: { id: string; inviteCode: string; anniversaryDate?: string | null } | null;
  partner: User | null;
};
