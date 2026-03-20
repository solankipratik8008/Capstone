import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context';
import { subscribeToUserChats } from '../../services/firebase/chat';
import { Chat } from '../../constants';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { ChatStackParamList } from '../../constants';

type NavProp = NativeStackNavigationProp<ChatStackParamList, 'ChatList'>;

const ChatListScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserChats(
      user.uid,
      (updatedChats) => {
        setChats(updatedChats);
        setIsLoading(false);
      },
      (error) => {
        console.error(error);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const handleOpenChat = (chat: Chat) => {
    if (!user) return;
    const otherUserId = chat.participants.find((p) => p !== user.uid) || '';
    const otherUserName = chat.participantNames[otherUserId] || 'User';
    navigation.navigate('Chat', {
      chatId: chat.id,
      otherUserName,
      spotTitle: chat.spotTitle,
    });
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptyText}>
          Message a parking spot owner from a spot's detail page to start chatting.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={chats}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => {
        const otherUserId = item.participants.find((p) => p !== user?.uid) || '';
        const otherUserName = item.participantNames[otherUserId] || 'User';
        const photoURL = item.participantPhotos?.[otherUserId];
        const unread = item.unreadCount?.[user?.uid || ''] || 0;

        return (
          <TouchableOpacity style={styles.chatItem} onPress={() => handleOpenChat(item)} activeOpacity={0.7}>
            <View style={styles.avatar}>
              {photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{otherUserName.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName} numberOfLines={1}>{otherUserName}</Text>
                <Text style={styles.chatTime}>{formatTime(item.lastMessageTime)}</Text>
              </View>
              <Text style={styles.spotTitle} numberOfLines={1}>{item.spotTitle}</Text>
              <View style={styles.lastMessageRow}>
                <Text style={[styles.lastMessage, unread > 0 && styles.lastMessageUnread]} numberOfLines={1}>
                  {item.lastMessage || 'No messages yet'}
                </Text>
                {unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingVertical: SPACING.sm },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.lg },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarImage: { width: 50, height: 50, borderRadius: 25 },
  avatarText: { fontSize: FONTS.sizes.xl, color: COLORS.white, fontWeight: FONTS.weights.bold },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  chatName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  chatTime: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  spotTitle: { fontSize: FONTS.sizes.sm, color: COLORS.primary, marginBottom: 2 },
  lastMessageRow: { flexDirection: 'row', alignItems: 'center' },
  lastMessage: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, flex: 1 },
  lastMessageUnread: { fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: SPACING.sm,
  },
  badgeText: { fontSize: FONTS.sizes.xs, color: COLORS.white, fontWeight: FONTS.weights.bold },
  separator: { height: 1, backgroundColor: COLORS.gray[100] },
});

export default ChatListScreen;
