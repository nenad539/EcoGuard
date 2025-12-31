import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Users } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { showError, showSuccess } from '../lib/toast';
import { colors, gradients, radius, spacing } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';
import { ScreenFade } from '../components/common/ScreenFade';
import { BackButton } from '../components/common/BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import { GlowCard } from '../components/common/GlowCard';
import { FormInput } from '../components/common/FormInput';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const FRIENDS_TABLE = 'prijatelji';
const GROUPS_TABLE = 'groups';
const GROUP_MEMBERS_TABLE = 'group_members';
const GROUP_ACTIVITIES_TABLE = 'group_activities';
const NOTIFICATIONS_TABLE = 'notifications';

type Profile = {
  id: string;
  korisnicko_ime: string;
  ukupno_poena?: number | null;
  trenutni_bedz?: 'gold' | 'silver' | 'bronze' | null;
};

export function CreateGroupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [userId, setUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [points, setPoints] = useState('50');
  const [goalValue, setGoalValue] = useState('');
  const [goalUnit, setGoalUnit] = useState('');
  const [friends, setFriends] = useState<Profile[]>([]);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id ?? null;
    setUserId(uid);
    if (!uid) return;
    const { data: profile } = await supabase
      .from('korisnik_profil')
      .select('korisnicko_ime')
      .eq('id', uid)
      .maybeSingle();
    if (profile?.korisnicko_ime) {
      setProfileName(profile.korisnicko_ime);
    }
  };

  const loadFriends = async (uid: string) => {
    const { data: links } = await supabase
      .from(FRIENDS_TABLE)
      .select('id, korisnik_od, korisnik_do, status')
      .or(`korisnik_od.eq.${uid},korisnik_do.eq.${uid}`)
      .eq('status', 'accepted');

    const friendIds = (links ?? [])
      .map((link: any) => (link.korisnik_od === uid ? link.korisnik_do : link.korisnik_od))
      .filter(Boolean);

    if (!friendIds.length) {
      setFriends([]);
      return;
    }

    const { data: profiles } = await supabase
      .from('korisnik_profil')
      .select('id, korisnicko_ime, ukupno_poena, trenutni_bedz')
      .in('id', friendIds);
    setFriends((profiles ?? []) as Profile[]);
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadFriends(userId);
  }, [userId]);

  const toggleInvite = (friendId: string) => {
    setInvitedIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const canSubmit = useMemo(() => {
    return groupName.trim().length > 0 && activityTitle.trim().length > 0;
  }, [groupName, activityTitle]);

  const insertGroup = async (uid: string) => {
    const basePayloads = [
      { name: groupName.trim(), description: groupDescription.trim() || null, created_by: uid },
      { name: groupName.trim(), description: groupDescription.trim() || null },
      { title: groupName.trim(), description: groupDescription.trim() || null, created_by: uid },
      { title: groupName.trim(), description: groupDescription.trim() || null },
    ];

    let lastError: any;
    for (const payload of basePayloads) {
      const { data, error } = await supabase.from(GROUPS_TABLE).insert(payload).select('id').single();
      if (!error && data?.id) return data.id as string;
      if (error?.code === '42703') {
        lastError = error;
        continue;
      }
      lastError = error;
    }

    throw lastError ?? new Error('Ne možemo kreirati grupu.');
  };

  const insertMembership = async (uid: string, groupId: string) => {
    const payloads = [
      { group_id: groupId, user_id: uid, role: 'owner' },
      { group_id: groupId, user_id: uid },
    ];

    let lastError: any;
    for (const payload of payloads) {
      const { error } = await supabase.from(GROUP_MEMBERS_TABLE).insert(payload);
      if (!error) return;
      if (error?.code === '42703') {
        lastError = error;
        continue;
      }
      lastError = error;
    }

    if (lastError) {
      throw lastError;
    }
  };

  const insertActivity = async (uid: string, groupId: string) => {
    const pointsValue = Number(points);
    const safePoints = Number.isFinite(pointsValue) ? pointsValue : null;
    const goalVal = Number(goalValue);
    const safeGoalValue = Number.isFinite(goalVal) && goalValue.trim() !== '' ? goalVal : null;
    const safeGoalUnit = goalUnit.trim() || null;

    const payloads = [
      {
        group_id: groupId,
        title: activityTitle.trim(),
        description: activityDescription.trim() || null,
        points: safePoints,
        goal_value: safeGoalValue,
        goal_unit: safeGoalUnit,
        created_by: uid,
      },
      {
        group_id: groupId,
        title: activityTitle.trim(),
        description: activityDescription.trim() || null,
        points: safePoints,
        goal_value: safeGoalValue,
        goal_unit: safeGoalUnit,
      },
      {
        group_id: groupId,
        title: activityTitle.trim(),
        description: activityDescription.trim() || null,
        points: safePoints,
      },
    ];

    let lastError: any;
    for (const payload of payloads) {
      const { error } = await supabase.from(GROUP_ACTIVITIES_TABLE).insert(payload);
      if (!error) return;
      if (error?.code === '42703') {
        lastError = error;
        continue;
      }
      lastError = error;
    }

    if (lastError) {
      throw lastError;
    }
  };

  const sendInvites = async (groupId: string) => {
    if (!invitedIds.length) return;
    const payload = invitedIds.map((friendId) => ({
      korisnik_id: friendId,
      title: 'Poziv u grupu',
      body: `${profileName || 'Korisnik'} vas poziva u grupu ${groupName.trim()}.`,
      type: 'group_invite',
      related_id: groupId,
      status: 'unread',
    }));
    await supabase.from(NOTIFICATIONS_TABLE).insert(payload);
  };

  const handleSubmit = async () => {
    if (!userId) {
      showError('Greška', 'Morate biti prijavljeni.');
      return;
    }
    if (!canSubmit) {
      showError('Greška', 'Unesite naziv grupe i naslov aktivnosti.');
      return;
    }
    if (points.trim() && !Number.isFinite(Number(points))) {
      showError('Greška', 'Poeni moraju biti broj.');
      return;
    }
    if (goalValue.trim() && !Number.isFinite(Number(goalValue))) {
      showError('Greška', 'Cilj mora biti broj.');
      return;
    }

    setSubmitting(true);
    try {
      const groupId = await insertGroup(userId);
      await insertMembership(userId, groupId);
      await insertActivity(userId, groupId);
      await sendInvites(groupId);
      showSuccess('Uspjeh', 'Grupa je kreirana.');
      navigation.navigate('GroupDetail', { groupId });
    } catch (error: any) {
      showError('Greška', error?.message ?? 'Ne možemo kreirati grupu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GradientBackground>
      <ScreenFade>
        <ScrollView contentContainerStyle={styles.container}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Kreiraj grupu</Text>

          <GlowCard style={styles.cardShell} contentStyle={styles.card}>
            <Text style={styles.sectionTitle}>Detalji grupe</Text>
            <FormInput label="Naziv grupe" value={groupName} onChangeText={setGroupName} />
            <Text style={styles.label}>Opis grupe</Text>
            <TextInput
              value={groupDescription}
              onChangeText={setGroupDescription}
              placeholder="Opišite cilj grupe..."
              placeholderTextColor={colors.muted}
              multiline
              style={styles.textArea}
            />
          </GlowCard>

          <GlowCard style={styles.cardShell} contentStyle={styles.card}>
            <Text style={styles.sectionTitle}>Prva aktivnost</Text>
            <FormInput label="Naziv aktivnosti" value={activityTitle} onChangeText={setActivityTitle} />
            <Text style={styles.label}>Opis aktivnosti</Text>
            <TextInput
              value={activityDescription}
              onChangeText={setActivityDescription}
              placeholder="Šta članovi treba da urade?"
              placeholderTextColor={colors.muted}
              multiline
              style={styles.textArea}
            />
            <View style={styles.inlineRow}>
              <View style={styles.inlineField}>
                <FormInput label="Poeni" value={points} onChangeText={setPoints} keyboardType="numeric" />
              </View>
              <View style={styles.inlineField}>
                <FormInput
                  label="Cilj (broj)"
                  value={goalValue}
                  onChangeText={setGoalValue}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <FormInput label="Cilj (jedinica)" value={goalUnit} onChangeText={setGoalUnit} />
          </GlowCard>

          <GlowCard style={styles.cardShell} contentStyle={styles.card}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Pozovi prijatelje</Text>
              <Users size={16} color={colors.softGreen} />
            </View>
            {friends.length === 0 ? (
              <Text style={styles.muted}>Nema prijatelja za poziv.</Text>
            ) : (
              friends.map((friend) => {
                const invited = invitedIds.includes(friend.id);
                return (
                  <View key={friend.id} style={styles.friendRow}>
                    <View>
                      <Text style={styles.friendName}>{friend.korisnicko_ime}</Text>
                      <Text style={styles.friendMeta}>Poeni: {friend.ukupno_poena ?? 0}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleInvite(friend.id)}>
                      <LinearGradient
                        colors={invited ? (['#1f2937', '#0f172a'] as const) : gradients.primary}
                        style={styles.inviteButton}
                      >
                        <Text style={styles.inviteLabel}>{invited ? 'Ukloni' : 'Pozovi'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </GlowCard>

          <TouchableOpacity onPress={handleSubmit} disabled={submitting || !canSubmit}>
            <LinearGradient colors={gradients.primary} style={styles.submitButton}>
              {submitting ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.submitLabel}>Kreiraj grupu</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </ScreenFade>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  cardShell: {
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  textArea: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inlineField: {
    flex: 1,
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  friendName: {
    color: colors.text,
    fontWeight: '600',
  },
  friendMeta: {
    color: colors.muted,
    marginTop: 2,
  },
  inviteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
  },
  inviteLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitLabel: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  muted: {
    color: colors.muted,
  },
});
