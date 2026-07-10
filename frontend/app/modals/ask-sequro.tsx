import React, { useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BASE_URL } from '@/api/client';           // ← single source of truth
import { TokenService } from '@/auth/token.service';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { COLORS, GRADIENTS, ICONS } from '@/utils/constants';

const SUGGESTED = [
  'How is my spending this month?',
  'Which category am I overspending in?',
  'How can I improve my savings rate?',
  'Am I on track for my budget?',
  'Suggest ways to grow my investments',
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

export default function AskSequroModal() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const listRef = useRef<FlatList>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToEnd = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    const assistantId = (Date.now() + 1).toString();

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ]);
    setInput('');
    setStreaming(true);
    scrollToEnd();

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      abortRef.current = new AbortController();
      const token = TokenService.getAccess();

      const res = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      if (!res.body) throw new Error('No stream body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content ?? '';
            accumulated += delta;
            setMessages(prev =>
              prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m)
            );
            scrollToEnd();
          } catch { /* skip malformed SSE chunks */ }
        }
      }

      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m)
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: 'Sorry, I had trouble responding. Please try again.', streaming: false }
              : m
          )
        );
      }
    } finally {
      setStreaming(false);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setMessages(prev => prev.map(m => m.streaming ? { ...m, streaming: false } : m));
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <Animated.View entering={FadeInUp.duration(250)} style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <LinearGradient colors={GRADIENTS.brand} style={styles.aiAvatarGrad}>
              <Text style={styles.aiAvatarText}>S</Text>
            </LinearGradient>
          </View>
        )}
        <View style={[styles.bubbleInner, isUser ? styles.userInner : styles.aiInner]}>
          {isUser ? (
            <LinearGradient colors={GRADIENTS.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.userGrad}>
              <Text style={styles.userText}>{item.content}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.aiContent}>
              <Text style={styles.aiText}>{item.content}</Text>
              {item.streaming && <ActivityIndicator size="small" color={COLORS.cyan} style={styles.spinner} />}
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LinearGradient colors={GRADIENTS.brand} style={styles.seqIcon}>
            <CategoryIcon icon={ICONS.aiSparkle} size={18} />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>Sequro AI</Text>
            <Text style={styles.headerSub}>{streaming ? 'Thinking...' : 'Your financial advisor'}</Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={messages.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Ask me anything about your finances</Text>
              <Text style={styles.emptySub}>I have full context of your accounts, spending, and investments.</Text>
              <View style={styles.suggestions}>
                {SUGGESTED.map((s, i) => (
                  <TouchableOpacity key={i} style={styles.suggChip} onPress={() => sendMessage(s)}>
                    <Text style={styles.suggText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          ) : null}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Sequro..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={500}
            selectionColor={COLORS.cyan}
            editable={!streaming}
          />
          {streaming ? (
            <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
              <Ionicons name="stop" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim()}
            >
              <LinearGradient
                colors={input.trim() ? GRADIENTS.brand : ['#2A2A4A', '#2A2A4A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.sendGrad}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seqIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  headerSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 1 },
  list: { padding: 16, paddingBottom: 8, gap: 12 },
  emptyState: { alignItems: 'center', paddingTop: 32, paddingHorizontal: 8 },
  emptyTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptySub: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  suggestions: { gap: 8, width: '100%' },
  suggChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  suggText: { color: COLORS.text, fontSize: 13 },
  bubble: { flexDirection: 'row', gap: 8, maxWidth: '92%' },
  userBubble: { alignSelf: 'flex-end' },
  aiBubble: { alignSelf: 'flex-start' },
  aiAvatar: { marginTop: 4 },
  aiAvatarGrad: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  aiAvatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  bubbleInner: { flex: 1 },
  userInner: { alignItems: 'flex-end' },
  aiInner: {},
  userGrad: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  userText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  aiContent: { backgroundColor: COLORS.bgCard, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border },
  aiText: { color: COLORS.text, fontSize: 14, lineHeight: 21 },
  spinner: { marginTop: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.bg },
  input: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: COLORS.bgCard, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: COLORS.text, fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.4 },
  sendGrad: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  stopBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.expense, alignItems: 'center', justifyContent: 'center' },
});
