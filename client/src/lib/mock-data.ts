export type Category = 'Science' | 'History' | 'Etymology' | 'Space' | 'Art' | 'Us' | 'Random';

export type ReactionType = 'mind-blown' | 'fascinating' | 'heart' | 'laugh' | 'thinking' | 'sad';

export type Fact = {
  id: string;
  text: string;
  imageUrl?: string;
  authorId: string;
  date: string;
  categories: Category[];
  reactions?: Record<string, ReactionType | null>; // Maps userId to reaction type
};

export type User = {
  id: string;
  name: string;
  avatar: string;
};

// Initial Mock Data
export const currentUser: User = {
  id: 'user_1',
  name: 'You',
  avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e2e8f0',
};

export const friendUser: User = {
  id: 'user_2',
  name: 'Alex',
  avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=ffd5dc',
};

export const mockFacts: Fact[] = [
  {
    id: 'f1',
    text: 'Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible.',
    authorId: 'user_1',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], // 2 days ago
    categories: ['History', 'Science'],
    reactions: { 'user_2': 'mind-blown' }
  },
  {
    id: 'f2',
    text: 'Octopuses have three hearts: one pumps blood around the body, while the other two pump it to the gills.',
    authorId: 'user_2',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    categories: ['Science'],
    reactions: { 'user_1': 'fascinating' }
  },
  {
    id: 'f3',
    text: 'Bananas grow curved because they reach for the sunlight, a process called negative geotropism.',
    authorId: 'user_1',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 1 day ago
    categories: ['Science']
  },
  {
    id: 'f4',
    text: 'Remember when we tried to bake that cake and ended up ordering pizza? That was exactly 3 years ago today.',
    authorId: 'user_2',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    categories: ['Us', 'History'],
    reactions: { 'user_1': 'mind-blown' }
  }
];
