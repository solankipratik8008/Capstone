import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ChatStackParamList, Message } from '../../constants';
import { useAuth } from '../../context';
import { markChatAsRead, sendMessage, subscribeToMessages } from '../../services/firebase/chat';
import { useAppTheme } from '../../theme';

type ChatRouteProp = RouteProp<ChatStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute<ChatRouteProp>();
  const { chatId, spotTitle } = route.params;
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!chatId) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToMessages(
      chatId,
      (nextMessages) => {
        setMessages(nextMessages);
        setIsLoading(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
      },
      () => setIsLoading(false)
    );

    if (user) {
      markChatAsRead(chatId, user.uid).catch(() => {});
    }

    return unsubscribe;
  }, [chatId, user]);

  const send = async () => {
    if (!inputText.trim() || !user || isSending) {
      return;
    }

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendMessage(chatId, user.uid, user.name, text);
    } catch {
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const safeTimeString = (createdAt: any): string => {
    try {
      const d = createdAt instanceof Date ? createdAt : createdAt?.toDate?.();
      if (!d || isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    try {
      const isMine = item.senderId === user?.uid;
      const previous = index > 0 ? messages[index - 1] : null;
      const showSender = !isMine && previous?.senderId !== item.senderId;

      return (
        <View style={[styles.messageGroup, isMine ? styles.mineGroup : styles.theirGroup]}>
          {showSender ? <Text style={styles.senderName}>{item.senderName}</Text> : null}
          <View style={[styles.bubble, isMine ? styles.mineBubble : styles.theirBubble]}>
            <Text style={[styles.messageText, isMine ? styles.mineText : styles.theirText]}>{item.text}</Text>
          </View>
          <Text style={[styles.timeText, isMine ? styles.mineTime : styles.theirTime]}>
            {safeTimeString(item.createdAt)}
          </Text>
        </View>
      );
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
    >
      <View style={styles.spotBanner}>
        <Ionicons name="location-outline" size={14} color={theme.colors.primary} />
        <Text style={styles.spotBannerText} numberOfLines={1}>{spotTitle}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={36} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Start the conversation</Text>
            <Text style={styles.emptySubtitle}>Ask about access, availability, or arrival details.</Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message"
          placeholderTextColor={theme.colors.inputPlaceholder}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={send}
          disabled={!inputText.trim() || isSending}
          activeOpacity={0.9}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
          ) : (
            <Ionicons name="send" size={18} color={theme.colors.textOnPrimary} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = ({ colors, spacing, radii, typography, shadows }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    spotBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surfaceElevated,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    spotBannerText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      flexGrow: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing.xxxl,
      paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
      marginTop: spacing.md,
      color: colors.textPrimary,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
    },
    emptySubtitle: {
      marginTop: spacing.xs,
      color: colors.textSecondary,
      fontSize: typography.sizes.md,
      textAlign: 'center',
      lineHeight: 22,
    },
    messageGroup: {
      maxWidth: '80%',
      marginVertical: spacing.xs,
    },
    mineGroup: {
      alignSelf: 'flex-end',
      alignItems: 'flex-end',
    },
    theirGroup: {
      alignSelf: 'flex-start',
      alignItems: 'flex-start',
    },
    senderName: {
      marginBottom: 4,
      marginLeft: spacing.sm,
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
    },
    bubble: {
      borderRadius: radii.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    mineBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: radii.sm,
    },
    theirBubble: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: radii.sm,
    },
    messageText: {
      fontSize: typography.sizes.md,
      lineHeight: 21,
    },
    mineText: {
      color: colors.textOnPrimary,
    },
    theirText: {
      color: colors.textPrimary,
    },
    timeText: {
      marginTop: 4,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    mineTime: {
      marginRight: spacing.xs,
    },
    theirTime: {
      marginLeft: spacing.xs,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      maxHeight: 112,
      minHeight: 48,
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.textPrimary,
      fontSize: typography.sizes.md,
    },
    sendButton: {
      width: 46,
      height: 46,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      ...shadows.glow,
    },
    sendButtonDisabled: {
      opacity: 0.45,
    },
  });

export default ChatScreen;
