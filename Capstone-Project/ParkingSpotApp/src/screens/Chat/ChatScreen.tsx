import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context';
import { subscribeToMessages, sendMessage, markChatAsRead } from '../../services/firebase/chat';
import { Message } from '../../constants';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants';
import { ChatStackParamList } from '../../constants';

type ChatRouteProp = RouteProp<ChatStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute<ChatRouteProp>();
  const { chatId, otherUserName, spotTitle } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(
      chatId,
      (updatedMessages) => {
        setMessages(updatedMessages);
        setIsLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      },
      (error) => {
        console.error(error);
        setIsLoading(false);
      }
    );

    // Mark as read when entering chat
    if (user) markChatAsRead(chatId, user.uid);

    return unsubscribe;
  }, [chatId, user]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || isSending) return;
    const text = inputText.trim();
    setInputText('');
    setIsSending(true);
    try {
      await sendMessage(chatId, user.uid, user.name, text);
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(text); // restore on failure
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: Date): string =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.uid;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showSenderName = !isOwn && prevMessage?.senderId !== item.senderId;

    return (
      <View style={[styles.messageWrapper, isOwn ? styles.ownWrapper : styles.otherWrapper]}>
        {showSenderName && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
            {item.text}
          </Text>
        </View>
        <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Spot title header */}
      <View style={styles.subHeader}>
        <Ionicons name="location-outline" size={14} color={COLORS.primary} />
        <Text style={styles.subHeaderText} numberOfLines={1}>{spotTitle}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyText}>Say hi! Start the conversation.</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="send" size={18} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    gap: 4,
  },
  subHeaderText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  messageWrapper: {
    marginVertical: SPACING.xs,
    maxWidth: '75%',
  },
  ownWrapper: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  otherWrapper: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
    marginLeft: SPACING.sm,
  },
  bubble: {
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: BORDER_RADIUS.sm,
  },
  otherBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  messageText: { fontSize: FONTS.sizes.md, lineHeight: 20 },
  ownText: { color: COLORS.white },
  otherText: { color: COLORS.textPrimary },
  timestamp: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  ownTimestamp: { marginRight: SPACING.xs },
  otherTimestamp: { marginLeft: SPACING.xs },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: COLORS.gray[300] },
});

export default ChatScreen;
