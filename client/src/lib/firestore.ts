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
} from "firebase/firestore";
import { db } from "./firebase";
import type { User, Fact, AuthState, ReactionType, Category } from "./mock-data";

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
  const bgColor = isUser1 ? "ffd5dc" : "d5e0ff";
  const avatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=${bgColor}`;
  const userData = { name, avatar, pairingId };
  await setDoc(doc(db, "users", uid), userData);
  return { id: uid, name, avatar };
}

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: uid, name: data.name, avatar: data.avatar };
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

export async function getPairingByCode(code: string): Promise<{ id: string; inviteCode: string; user1Id: string; user2Id: string | null } | null> {
  const q = query(collection(db, "pairings"), where("inviteCode", "==", code));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return { id: d.id, inviteCode: data.inviteCode, user1Id: data.user1Id, user2Id: data.user2Id || null };
}

export async function getPairing(pairingId: string): Promise<{ id: string; inviteCode: string; user1Id: string; user2Id: string | null } | null> {
  const snap = await getDoc(doc(db, "pairings", pairingId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: snap.id, inviteCode: data.inviteCode, user1Id: data.user1Id, user2Id: data.user2Id || null };
}

export async function joinPairing(pairingId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, "pairings", pairingId), { user2Id: userId });
}

export async function createFact(
  authorId: string,
  pairingId: string,
  text: string,
  categories: Category[],
  date: string
): Promise<Fact> {
  const factRef = await addDoc(collection(db, "facts"), {
    text,
    authorId,
    pairingId,
    date,
    categories,
  });
  return {
    id: factRef.id,
    text,
    authorId,
    pairingId,
    date,
    categories,
    reactions: {},
  };
}

export async function updateFact(
  factId: string,
  text: string,
  categories: Category[]
): Promise<void> {
  await updateDoc(doc(db, "facts", factId), { text, categories });
}

export async function getFactsByPairing(pairingId: string): Promise<Fact[]> {
  const q = query(
    collection(db, "facts"),
    where("pairingId", "==", pairingId)
  );
  const snap = await getDocs(q);

  const reactionPromises = snap.docs.map(async (d) => {
    const reactionsSnap = await getDocs(collection(db, "facts", d.id, "reactions"));
    const reactions: Record<string, ReactionType | null> = {};
    reactionsSnap.forEach((r) => {
      reactions[r.id] = r.data().type as ReactionType;
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
      categories: data.categories || [],
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
    where("date", "==", date)
  );
  const snap = await getDocs(q);
  return snap.docs.some(d => d.data().authorId === authorId);
}

export async function setReaction(factId: string, userId: string, type: string): Promise<void> {
  await setDoc(doc(db, "facts", factId, "reactions", userId), { type });
}

export async function removeReaction(factId: string, userId: string): Promise<void> {
  await deleteDoc(doc(db, "facts", factId, "reactions", userId));
}


export async function findExistingPairingForUser(uid: string): Promise<{ id: string; inviteCode: string; user1Id: string; user2Id: string | null } | null> {
  const q1 = query(collection(db, "pairings"), where("user1Id", "==", uid));
  const snap1 = await getDocs(q1);
  if (!snap1.empty) {
    const d = snap1.docs[0];
    const data = d.data();
    return { id: d.id, inviteCode: data.inviteCode, user1Id: data.user1Id, user2Id: data.user2Id || null };
  }
  const q2 = query(collection(db, "pairings"), where("user2Id", "==", uid));
  const snap2 = await getDocs(q2);
  if (!snap2.empty) {
    const d = snap2.docs[0];
    const data = d.data();
    return { id: d.id, inviteCode: data.inviteCode, user1Id: data.user1Id, user2Id: data.user2Id || null };
  }
  return null;
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

    let partner: User | null = null;
    const partnerId = pairing.user1Id === uid ? pairing.user2Id : pairing.user1Id;
    if (partnerId) {
      partner = await getUser(partnerId);
    }

    return {
      user,
      pairing: { id: pairing.id, inviteCode: pairing.inviteCode },
      partner,
    };
  } catch (err) {
    console.error("[Curio] getAuthState error:", err);
    return null;
  }
}

