/**
 * Firebase Firestore Service for Real-time Chat
 * Handles chat creation, messaging, and real-time subscriptions
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  setDoc,
} from 'firebase/firestore';
import { db } from './config';
import { Chat, Message, COLLECTIONS } from '../../constants';

// Re-export COLLECTIONS from the right place
const CHATS = 'chats';
const MESSAGES = 'messages';

/**
 * Converts Firestore doc to Chat object
 */
const convertDocToChat = (docId: string, data: any): Chat => ({
  id: docId,
  participants: data.participants || [],
  participantNames: data.participantNames || {},
  participantPhotos: data.participantPhotos,
  lastMessage: data.lastMessage || '',
  lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
  spotId: data.spotId || '',
  spotTitle: data.spotTitle || '',
  createdAt: data.createdAt?.toDate() || new Date(),
  unreadCount: data.unreadCount || {},
});

/**
 * Converts Firestore doc to Message object
 */
const convertDocToMessage = (docId: string, data: any): Message => ({
  id: docId,
  chatId: data.chatId || '',
  senderId: data.senderId || '',
  senderName: data.senderName || '',
  text: data.text || '',
  createdAt: data.createdAt?.toDate() || new Date(),
  read: data.read ?? false,
});

/**
 * Gets an existing chat between two users for a spot, or creates one.
 */
export const getOrCreateChat = async (
  userId: string,
  userName: string,
  ownerId: string,
  ownerName: string,
  spotId: string,
  spotTitle: string,
  userPhoto?: string,
  ownerPhoto?: string
): Promise<string> => {
  try {
    // Check for existing chat with these participants for this spot
    const chatsRef = collection(db, CHATS);
    const q = query(chatsRef, where('spotId', '==', spotId), where('participants', 'array-contains', userId));
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.participants.includes(ownerId)) {
        return docSnap.id;
      }
    }

    // Create a new chat
    const participantPhotos: { [uid: string]: string } = {};
    if (userPhoto) participantPhotos[userId] = userPhoto;
    if (ownerPhoto) participantPhotos[ownerId] = ownerPhoto;

    const chatData = {
      participants: [userId, ownerId],
      participantNames: {
        [userId]: userName,
        [ownerId]: ownerName,
      },
      participantPhotos,
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      spotId,
      spotTitle,
      createdAt: serverTimestamp(),
      unreadCount: { [userId]: 0, [ownerId]: 0 },
    };

    const chatRef = await addDoc(chatsRef, chatData);
    return chatRef.id;
  } catch (error: any) {
    console.error('Error getting or creating chat:', error);
    throw new Error(error.message || 'Failed to start conversation');
  }
};

/**
 * Sends a message in a chat.
 * Automatically increments unread count for all participants except the sender.
 */
export const sendMessage = async (
  chatId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> => {
  try {
    const chatRef = doc(db, CHATS, chatId);
    const chatSnap = await getDoc(chatRef);
    const chatData = chatSnap.data();
    const participants: string[] = chatData?.participants || [];
    const currentUnread: { [uid: string]: number } = chatData?.unreadCount || {};

    // Build unread increment updates for everyone except the sender
    const unreadUpdates: { [key: string]: number } = {};
    for (const uid of participants) {
      if (uid !== senderId) {
        unreadUpdates[`unreadCount.${uid}`] = (currentUnread[uid] || 0) + 1;
      }
    }

    const messagesRef = collection(db, CHATS, chatId, MESSAGES);
    await addDoc(messagesRef, {
      chatId,
      senderId,
      senderName,
      text: text.trim(),
      createdAt: serverTimestamp(),
      read: false,
    });

    await updateDoc(chatRef, {
      lastMessage: text.trim(),
      lastMessageTime: serverTimestamp(),
      ...unreadUpdates,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    throw new Error(error.message || 'Failed to send message');
  }
};

/**
 * Marks all messages in a chat as read for a user
 */
export const markChatAsRead = async (chatId: string, userId: string): Promise<void> => {
  try {
    const chatRef = doc(db, CHATS, chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${userId}`]: 0,
    });
  } catch (error) {
    console.error('Error marking chat as read:', error);
  }
};

/**
 * Subscribe to real-time messages in a chat
 */
export const subscribeToMessages = (
  chatId: string,
  onUpdate: (messages: Message[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const messagesRef = collection(db, CHATS, chatId, MESSAGES);
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => convertDocToMessage(d.id, d.data()));
      onUpdate(messages);
    },
    (error) => {
      console.error('Messages snapshot error:', error);
      onError(new Error('Failed to load messages'));
    }
  );
};

/**
 * Subscribe to all chats for a user (real-time)
 */
export const subscribeToUserChats = (
  userId: string,
  onUpdate: (chats: Chat[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const chatsRef = collection(db, CHATS);
  const q = query(chatsRef, where('participants', 'array-contains', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const chats = snapshot.docs
        .map((d) => convertDocToChat(d.id, d.data()))
        .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
      onUpdate(chats);
    },
    (error) => {
      console.error('Chats snapshot error:', error);
      onError(new Error('Failed to load conversations'));
    }
  );
};
