import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatStackParamList } from '../constants';
import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import { COLORS } from '../constants';

const Stack = createNativeStackNavigator<ChatStackParamList>();

export const ChatStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <Stack.Screen
      name="ChatList"
      component={ChatListScreen}
      options={{ title: 'Messages' }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={({ route }) => ({ title: route.params.otherUserName })}
    />
  </Stack.Navigator>
);

export default ChatStackNavigator;
