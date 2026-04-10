import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Chat, ChatStackParamList } from '../../constants';
import { useAuth } from '../../context';
import { subscribeToUserChats } from '../../services/firebase/chat';
import { useAppTheme } from '../../theme';

type NavProp = NativeStackNavigationProp<ChatStackParamList, 'ChatList'>;

const ChatListScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserChats(
      user.uid,
      (nextChats) => {
        setChats(nextChats);
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );

    return unsubscribe;
  }, [user]);

  const openChat = (chat: Chat) => {
    if (!user) {
      return;
    }

    const otherUserId = chat.participants.find((participant) => participant !== user.uid) || '';
    const otherUserName = chat.participantNames[otherUserId] || 'User';

    navigation.navigate('Chat', {
      chatId: chat.id,
      otherUserName,
      spotTitle: chat.spotTitle,
    });
  };

  const formatTime = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (days === 1) {
      return 'Yesterday';
    }

    if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="chatbubble-ellipses-outline" size={48} color={theme.colors.textMuted} />
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptyText}>
          Message a parking spot owner from a listing to start chatting.
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
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => {
        const otherUserId = item.participants.find((participant) => participant !== user?.uid) || '';
        const otherUserName = item.participantNames[otherUserId] || 'User';
        const photoURL = item.participantPhotos?.[otherUserId];
        const unread = item.unreadCount?.[user?.uid || ''] || 0;

        return (
          <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)} activeOpacity={0.85}>
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
                {unread > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
};

const createStyles = ({ colors, spacing, radii, typography }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    list: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingVertical: spacing.sm,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: spacing.xl,
    },
    emptyTitle: {
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      color: colors.textPrimary,
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: typography.sizes.md,
      lineHeight: 22,
      textAlign: 'center',
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      marginRight: spacing.md,
    },
    avatarImage: {
      width: 52,
      height: 52,
      borderRadius: radii.full,
    },
    avatarText: {
      color: colors.textOnPrimary,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
    },
    chatInfo: {
      flex: 1,
    },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    chatName: {
      flex: 1,
      marginRight: spacing.sm,
      color: colors.textPrimary,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
    },
    chatTime: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
    },
    spotTitle: {
      color: colors.primary,
      fontSize: typography.sizes.sm,
      marginBottom: 4,
    },
    lastMessageRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    lastMessage: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: typography.sizes.md,
    },
    lastMessageUnread: {
      color: colors.textPrimary,
      fontWeight: typography.weights.semibold,
    },
    badge: {
      minWidth: 22,
      height: 22,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      marginLeft: spacing.sm,
      backgroundColor: colors.primary,
    },
    badgeText: {
      color: colors.textOnPrimary,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.bold,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
    },
  });

export default ChatListScreen;
