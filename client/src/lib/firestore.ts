import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
  runTransaction,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import type { User, Fact, AuthState, ReactionType, Category, DailyAnswer, JournalEntry } from "./mock-data";

const VALID_REACTIONS: Set<string> = new Set(['mind-blown', 'fascinating', 'heart', 'laugh', 'thinking', 'sad']);
export const VALID_CATEGORIES_LIST = ['Science', 'History', 'Etymology', 'Space', 'Art', 'Us', 'Random'] as const;
const VALID_CATEGORIES: Set<string> = new Set(VALID_CATEGORIES_LIST);
export const VALID_CATEGORIES_SET = VALID_CATEGORIES;
const MAX_FACT_LENGTH = 5000;
const MAX_ANSWER_LENGTH = 2000;
const MAX_NAME_LENGTH = 50;

interface ReconnectData {
  uid: string;
  name: string;
  pairingId: string;
  isUser1: boolean;
}

export function setReconnectCookie(data: ReconnectData): void {
  const json = encodeURIComponent(JSON.stringify(data));
  document.cookie = `curio_rc=${json}; max-age=31536000; path=/; SameSite=Lax`;
}

export function getReconnectCookie(): ReconnectData | null {
  const match = document.cookie.match(/curio_rc=([^;]+)/);
  if (!match) return null;
  try {
    const data = JSON.parse(decodeURIComponent(match[1]));
    if (
      typeof data?.uid !== 'string' || !data.uid ||
      typeof data?.name !== 'string' || !data.name ||
      typeof data?.pairingId !== 'string' || !data.pairingId ||
      typeof data?.isUser1 !== 'boolean'
    ) {
      return null;
    }
    return data as ReconnectData;
  } catch {
    return null;
  }
}

export async function reconnectUser(
  newUid: string,
  oldUid: string,
  name: string,
  pairingId: string,
  isUser1: boolean
): Promise<void> {
  const safeName = name.trim().slice(0, MAX_NAME_LENGTH);
  if (safeName.length < 2) {
    clearReconnectCookie();
    throw new Error("Invalid reconnect data");
  }

  const avatar = buildAvatarUrl(safeName, isUser1);

  await setDoc(doc(db, "users", newUid), { name: safeName, avatar, pairingId });

  let pairingData;
  try {
    const pairingSnap = await getDoc(doc(db, "pairings", pairingId));
    if (!pairingSnap.exists()) {
      await deleteDoc(doc(db, "users", newUid));
      clearReconnectCookie();
      throw new Error("Pairing no longer exists");
    }
    pairingData = pairingSnap.data();
  } catch (err: any) {
    if (err?.message === "Pairing no longer exists") throw err;
    try { await deleteDoc(doc(db, "users", newUid)); } catch {}
    clearReconnectCookie();
    throw new Error("Cannot access pairing");
  }

  const expectedField = isUser1 ? "user1Id" : "user2Id";
  if (pairingData[expectedField] !== oldUid) {
    try { await deleteDoc(doc(db, "users", newUid)); } catch {}
    clearReconnectCookie();
    throw new Error("Pairing membership mismatch");
  }

  const field = isUser1 ? "user1Id" : "user2Id";
  await updateDoc(doc(db, "pairings", pairingId), { [field]: newUid });

  const answersQuery = query(
    collection(db, "dailyAnswers"),
    where("pairingId", "==", pairingId)
  );
  const answersSnap = await getDocs(answersQuery);
  for (const ansDoc of answersSnap.docs) {
    const ansData = ansDoc.data();
    if (ansData.answers && oldUid in ansData.answers) {
      try {
        await updateDoc(doc(db, "dailyAnswers", ansDoc.id), {
          [`answers.${newUid}`]: ansData.answers[oldUid],
        });
      } catch {}
    }
    try {
      const oldReactionRef = doc(db, "dailyAnswers", ansDoc.id, "reactions", oldUid);
      const oldReactionSnap = await getDoc(oldReactionRef);
      if (oldReactionSnap.exists()) {
        await setDoc(doc(db, "dailyAnswers", ansDoc.id, "reactions", newUid), oldReactionSnap.data());
        try { await deleteDoc(oldReactionRef); } catch {}
      }
    } catch {}
  }

  const allJournalQuery = query(
    collection(db, "journalEntries"),
    where("pairingId", "==", pairingId)
  );
  const allJournalSnap = await getDocs(allJournalQuery);
  for (const journalDoc of allJournalSnap.docs) {
    if (journalDoc.data().authorId === oldUid) {
      try { await updateDoc(doc(db, "journalEntries", journalDoc.id), { authorId: newUid }); } catch {}
    }
  }

  const allFactsQuery = query(
    collection(db, "facts"),
    where("pairingId", "==", pairingId)
  );
  const allFactsSnap = await getDocs(allFactsQuery);
  for (const factDoc of allFactsSnap.docs) {
    if (factDoc.data().authorId === oldUid) {
      try { await updateDoc(doc(db, "facts", factDoc.id), { authorId: newUid }); } catch {}
    }
    try {
      const oldReactionRef = doc(db, "facts", factDoc.id, "reactions", oldUid);
      const oldReactionSnap = await getDoc(oldReactionRef);
      if (oldReactionSnap.exists()) {
        await setDoc(doc(db, "facts", factDoc.id, "reactions", newUid), oldReactionSnap.data());
        try { await deleteDoc(oldReactionRef); } catch {}
      }
    } catch {}
  }

  setReconnectCookie({ uid: newUid, name: safeName, pairingId, isUser1 });
}

function clearReconnectCookie(): void {
  document.cookie = `curio_rc=; max-age=0; path=/; SameSite=Lax`;
}

const LONG_HAIR_VARIANTS = "variant26,variant32,variant39,variant40,variant42,variant45,variant46,variant47,variant48,variant50,variant57,variant59,variant60,variant61,variant62,variant63";

function buildAvatarUrl(name: string, isUser1: boolean): string {
  const seed = encodeURIComponent(name);
  const bgColor = isUser1 ? "ffd5dc" : "d5e0ff";
  if (isUser1) {
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=${bgColor}&hair=${LONG_HAIR_VARIANTS}&beardProbability=0`;
  }
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=${bgColor}`;
}

function generateInviteCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createUser(
  uid: string,
  name: string,
  pairingId: string,
  isUser1: boolean
): Promise<User> {
  const safeName = name.trim().slice(0, MAX_NAME_LENGTH);
  if (safeName.length < 2) throw new Error("Name must be at least 2 characters");
  const avatar = buildAvatarUrl(safeName, isUser1);
  const userData = { name: safeName, avatar, pairingId };
  await setDoc(doc(db, "users", uid), userData);
  return { id: uid, name: safeName, avatar };
}

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: uid, name: data.name, avatar: data.avatar };
}

export async function deleteUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid));
}

export async function createPairing(userId: string): Promise<{ id: string; inviteCode: string }> {
  const inviteCode = generateInviteCode();
  const pairingRef = await addDoc(collection(db, "pairings"), {
    inviteCode,
    user1Id: userId,
    user2Id: null,
  });
  return { id: pairingRef.id, inviteCode };
}

export async function createPairingAndUser(
  uid: string,
  name: string
): Promise<{ pairingId: string; inviteCode: string; user: User }> {
  const safeName = name.trim().slice(0, MAX_NAME_LENGTH);
  if (safeName.length < 2) throw new Error("Name must be at least 2 characters");
  const avatar = buildAvatarUrl(safeName, true);
  const inviteCode = generateInviteCode();

  const pairingRef = doc(collection(db, "pairings"));
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (transaction) => {
    transaction.set(pairingRef, { inviteCode, user1Id: uid, user2Id: null });
    transaction.set(userRef, { name: safeName, avatar, pairingId: pairingRef.id });
  });

  return {
    pairingId: pairingRef.id,
    inviteCode,
    user: { id: uid, name: safeName, avatar },
  };
}

export async function getPairingByCode(code: string): Promise<{ id: string; inviteCode: string; user1Id: string; user2Id: string | null; anniversaryDate: string | null } | null> {
  const q = query(collection(db, "pairings"), where("inviteCode", "==", code));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return { id: d.id, inviteCode: data.inviteCode, user1Id: data.user1Id, user2Id: data.user2Id || null, anniversaryDate: data.anniversaryDate || null };
}

export async function getPairing(pairingId: string): Promise<{ id: string; inviteCode: string; user1Id: string; user2Id: string | null; anniversaryDate: string | null } | null> {
  const snap = await getDoc(doc(db, "pairings", pairingId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: snap.id, inviteCode: data.inviteCode, user1Id: data.user1Id, user2Id: data.user2Id || null, anniversaryDate: data.anniversaryDate || null };
}

export async function joinPairing(pairingId: string, userId: string): Promise<void> {
  const pairingRef = doc(db, "pairings", pairingId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(pairingRef);
    if (!snap.exists()) throw new Error("Pairing not found");
    if (snap.data().user2Id) throw new Error("This pairing is already full");
    transaction.update(pairingRef, { user2Id: userId });
  });
}

export async function createFact(
  authorId: string,
  pairingId: string,
  text: string,
  categories: Category[],
  date: string
): Promise<Fact> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date format");
  const safeText = text.slice(0, MAX_FACT_LENGTH);
  if (!safeText.trim()) throw new Error("Discovery text is required");

  const validCats = categories.filter(c => VALID_CATEGORIES.has(c));
  if (validCats.length === 0) throw new Error("At least one valid category is required");

  const factRef = await addDoc(collection(db, "facts"), {
    text: safeText,
    authorId,
    pairingId,
    date,
    categories: validCats,
  });
  return {
    id: factRef.id,
    text: safeText,
    authorId,
    pairingId,
    date,
    categories: validCats,
    reactions: {},
  };
}

export async function updateFact(
  factId: string,
  text: string,
  categories: Category[]
): Promise<void> {
  const safeText = text.slice(0, MAX_FACT_LENGTH);
  if (!safeText.trim()) throw new Error("Discovery text is required");

  const validCats = categories.filter(c => VALID_CATEGORIES.has(c));
  if (validCats.length === 0) throw new Error("At least one valid category is required");

  await updateDoc(doc(db, "facts", factId), { text: safeText, categories: validCats });
}

export async function getFactsByPairing(pairingId: string): Promise<Fact[]> {
  const q = query(
    collection(db, "facts"),
    where("pairingId", "==", pairingId)
  );
  const snap = await getDocs(q);

  const reactionPromises = snap.docs.map(async (d) => {
    const reactionsSnap = await getDocs(collection(db, "facts", d.id, "reactions"));
    const reactions: Record<string, ReactionType> = {};
    reactionsSnap.forEach((r) => {
      const type = r.data().type;
      if (VALID_REACTIONS.has(type)) {
        reactions[r.id] = type as ReactionType;
      }
    });
    return { docId: d.id, reactions };
  });

  const reactionResults = await Promise.all(reactionPromises);
  const reactionsMap = new Map(reactionResults.map(r => [r.docId, r.reactions]));

  const facts: Fact[] = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      text: data.text,
      authorId: data.authorId,
      pairingId: data.pairingId,
      date: data.date,
      categories: (data.categories || []).filter((c: string) => VALID_CATEGORIES.has(c)),
      reactions: reactionsMap.get(d.id) || {},
    };
  });

  facts.sort((a, b) => b.date.localeCompare(a.date));
  return facts;
}

export async function hasPostedToday(authorId: string, pairingId: string, date: string): Promise<boolean> {
  const q = query(
    collection(db, "facts"),
    where("pairingId", "==", pairingId),
    where("authorId", "==", authorId),
    where("date", "==", date),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function setReaction(factId: string, userId: string, type: ReactionType): Promise<void> {
  if (!VALID_REACTIONS.has(type)) throw new Error("Invalid reaction type");
  await setDoc(doc(db, "facts", factId, "reactions", userId), { type });
}

export async function removeReaction(factId: string, userId: string): Promise<void> {
  await deleteDoc(doc(db, "facts", factId, "reactions", userId));
}

export async function setQAReaction(answerId: string, userId: string, type: ReactionType): Promise<void> {
  if (!VALID_REACTIONS.has(type)) throw new Error("Invalid reaction type");
  await setDoc(doc(db, "dailyAnswers", answerId, "reactions", userId), { type });
}

export async function removeQAReaction(answerId: string, userId: string): Promise<void> {
  await deleteDoc(doc(db, "dailyAnswers", answerId, "reactions", userId));
}

export async function setAnniversaryDate(pairingId: string, date: string): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date format");
  const [y, m, d] = date.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  if (parsed.getFullYear() !== y || parsed.getMonth() !== m - 1 || parsed.getDate() !== d) {
    throw new Error("Invalid date");
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed > today) throw new Error("Anniversary date cannot be in the future");
  await updateDoc(doc(db, "pairings", pairingId), { anniversaryDate: date });
}

export async function submitDailyAnswer(
  pairingId: string,
  date: string,
  questionText: string,
  category: string,
  userId: string,
  answer: string
): Promise<DailyAnswer> {
  const safeAnswer = answer.slice(0, MAX_ANSWER_LENGTH);
  if (!safeAnswer.trim()) throw new Error("Answer is required");

  const docId = `${pairingId}_${date}`;
  const ref = doc(db, "dailyAnswers", docId);

  try {
    let finalAnswers: Record<string, string> = {};

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);

      if (snap.exists()) {
        const existingData = snap.data();
        finalAnswers = { ...existingData.answers, [userId]: safeAnswer };
        transaction.update(ref, { answers: finalAnswers });
      } else {
        finalAnswers = { [userId]: safeAnswer };
        transaction.set(ref, { pairingId, date, questionText, category, answers: finalAnswers });
      }
    });

    return {
      id: docId,
      pairingId,
      date,
      questionText,
      category,
      answers: finalAnswers,
      reactions: {},
    };
  } catch (err: any) {
    console.error("[Curio] submitDailyAnswer failed:", err?.code, err?.message);
    throw err;
  }
}

export async function getDailyAnswerForDate(pairingId: string, date: string): Promise<DailyAnswer | null> {
  const docId = `${pairingId}_${date}`;
  const snap = await getDoc(doc(db, "dailyAnswers", docId));
  if (!snap.exists()) return null;
  const data = snap.data();
  const reactSnap = await getDocs(collection(db, "dailyAnswers", docId, "reactions"));
  const reactions: Record<string, ReactionType> = {};
  reactSnap.docs.forEach(r => {
    const type = r.data().type;
    if (VALID_REACTIONS.has(type)) reactions[r.id] = type as ReactionType;
  });
  return { id: docId, pairingId: data.pairingId, date: data.date, questionText: data.questionText, category: data.category, answers: data.answers || {}, reactions };
}

export async function getAllDailyAnswers(pairingId: string): Promise<DailyAnswer[]> {
  const q = query(collection(db, "dailyAnswers"), where("pairingId", "==", pairingId));
  const snap = await getDocs(q);

  const reactionPromises = snap.docs.map(async (d) => {
    const reactSnap = await getDocs(collection(db, "dailyAnswers", d.id, "reactions"));
    const reactions: Record<string, ReactionType> = {};
    reactSnap.docs.forEach(r => {
      const type = r.data().type;
      if (VALID_REACTIONS.has(type)) reactions[r.id] = type as ReactionType;
    });
    return { docId: d.id, reactions };
  });
  const reactionResults = await Promise.all(reactionPromises);
  const reactionsMap = new Map(reactionResults.map(r => [r.docId, r.reactions]));

  return snap.docs
    .map(d => {
      const data = d.data();
      return { id: d.id, pairingId: data.pairingId, date: data.date, questionText: data.questionText, category: data.category, answers: data.answers || {}, reactions: reactionsMap.get(d.id) || {} } as DailyAnswer;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}


const MAX_JOURNAL_TEXT_LENGTH = 2000;
const MAX_IMAGE_SIZE = 800000;

export async function createJournalEntry(
  authorId: string,
  pairingId: string,
  date: string,
  text: string,
  imageData?: string
): Promise<JournalEntry> {
  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) throw new Error("Invalid date format");
  if (!text.trim() && !imageData) throw new Error("Entry must have text or an image");
  if (text.length > MAX_JOURNAL_TEXT_LENGTH) throw new Error("Text too long");
  if (imageData && imageData.length > MAX_IMAGE_SIZE) throw new Error("Image too large");

  const docData: Record<string, any> = {
    authorId,
    pairingId,
    date,
    text: text.trim(),
  };
  if (imageData) docData.imageData = imageData;

  const ref = await addDoc(collection(db, "journalEntries"), docData);
  return { id: ref.id, pairingId, authorId, date, text: text.trim(), imageData };
}

export async function getJournalEntries(pairingId: string): Promise<JournalEntry[]> {
  const q = query(collection(db, "journalEntries"), where("pairingId", "==", pairingId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => {
      const data = d.data();
      return {
        id: d.id,
        pairingId: data.pairingId,
        authorId: data.authorId,
        date: data.date,
        text: data.text || '',
        imageData: data.imageData,
      } as JournalEntry;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function deleteJournalEntry(entryId: string): Promise<void> {
  await deleteDoc(doc(db, "journalEntries", entryId));
}

export async function getAuthState(uid: string): Promise<AuthState | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const data = snap.data();

    const user: User = { id: uid, name: data.name, avatar: data.avatar };
    const pairingId = data.pairingId || null;
    if (!pairingId) return null;

    const pairing = await getPairing(pairingId);
    if (!pairing) return null;

    if (pairing.user1Id !== uid && pairing.user2Id !== uid) {
      console.error("[Curio] User not a member of their stored pairing");
      return null;
    }

    let partner: User | null = null;
    const partnerId = pairing.user1Id === uid ? pairing.user2Id : pairing.user1Id;
    if (partnerId) {
      partner = await getUser(partnerId);
    }

    return {
      user,
      pairing: { id: pairing.id, inviteCode: pairing.inviteCode, anniversaryDate: pairing.anniversaryDate },
      partner,
    };
  } catch (err) {
    console.error("[Curio] getAuthState error:", err);
    return null;
  }
}

const MAX_GRATITUDE_LENGTH = 1000;

export async function submitGratitude(
  pairingId: string,
  date: string,
  userId: string,
  text: string
): Promise<import('./mock-data').DailyGratitude> {
  const safeText = text.slice(0, MAX_GRATITUDE_LENGTH);
  if (!safeText.trim()) throw new Error("Gratitude text is required");

  const docId = `${pairingId}_${date}`;
  const ref = doc(db, "dailyGratitudes", docId);

  try {
    let finalEntries: Record<string, string> = {};

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);

      if (snap.exists()) {
        const existingData = snap.data();
        finalEntries = { ...existingData.entries, [userId]: safeText };
        transaction.update(ref, { entries: finalEntries });
      } else {
        finalEntries = { [userId]: safeText };
        transaction.set(ref, {
          pairingId,
          date,
          entries: finalEntries,
        });
      }
    });

    return { id: docId, pairingId, date, entries: finalEntries };
  } catch (err: any) {
    console.error("[Curio] submitGratitude failed:", err?.code, err?.message);
    throw err;
  }
}

export async function getAllGratitudes(pairingId: string): Promise<import('./mock-data').DailyGratitude[]> {
  const q = query(collection(db, "dailyGratitudes"), where("pairingId", "==", pairingId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => {
      const data = d.data();
      return { id: d.id, pairingId: data.pairingId, date: data.date, entries: data.entries || {} } as import('./mock-data').DailyGratitude;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getBookmarks(userId: string): Promise<import('./mock-data').Bookmark[]> {
  const snap = await getDocs(collection(db, "users", userId, "bookmarks"));
  return snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, itemType: data.itemType, itemId: data.itemId, savedAt: data.savedAt };
  });
}

export async function addBookmark(userId: string, itemType: 'fact' | 'qa', itemId: string): Promise<import('./mock-data').Bookmark> {
  const savedAt = new Date().toISOString();
  const ref = await addDoc(collection(db, "users", userId, "bookmarks"), {
    itemType,
    itemId,
    savedAt,
  });
  return { id: ref.id, itemType, itemId, savedAt };
}

export async function removeBookmark(userId: string, bookmarkId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "bookmarks", bookmarkId));
}
