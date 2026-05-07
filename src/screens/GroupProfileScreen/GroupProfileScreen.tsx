import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, MoreHorizontal, UserPlus } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { useGroups } from '../../hooks/useGroups';
import ProfileTabs from '../../components/ProfileTabs';
import PulseGrid from '../../components/visualization/PulseGrid';
import CoordinatesGrid from '../../components/visualization/CoordinatesGrid';
import { useStateCoordinates } from '../../hooks/useStateCoordinates';
import { useCoordinateMapping } from '../../hooks/useCoordinateMapping';
import { useEmotionStates } from '../../hooks/useEmotionStates';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import PairsAvatarOverlay from '../../components/visualization/PairsAvatarOverlay';
import { CheckInConfirmModal } from '../../components/checkin/CheckInOverlay';
import { useQuickCheckIn } from '../../hooks/useQuickCheckIn';
import { colors, pillTabStyles } from '../../theme';
import GroupOutlookTab from './components/GroupOutlookTab';
import GroupMembersTab from './components/GroupMembersTab';
import GroupAdminModals from './components/GroupAdminModals';
import { styles } from './styles';

const bannerImage = require('../../../assets/ep-app-imagery.webp');

type GroupProfileRouteProp = RouteProp<RootStackParamList, 'GroupProfile'>;
type GroupProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'GroupProfile'>;

const ADMIN_ROLES = ['leader', 'owner', 'primary owner'];

export default function GroupProfileScreen() {
  const navigation = useNavigation<GroupProfileNavProp>();
  const route = useRoute<GroupProfileRouteProp>();
  const { groupId, groupName: paramGroupName, forestId, runningStats, imageUrl: groupImageUrl, role: groupRole, membersCoordinatesCount, checkins7day, checkins30day } = route.params;
  const [activeTab, setActiveTab] = useState<'Pulse' | 'Outlook' | 'Members'>('Pulse');
  const [pulsePeriod, setPulsePeriod] = useState<'Today' | '7 Days' | '30 Days'>('Today');
  const { getMembers, updateGroupName, updateProfilePic, updateBanner } = useGroups();
  const { emotionStates } = useEmotionStates();
  const { coordinates } = useStateCoordinates();
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Modal state
  const [menuVisible, setMenuVisible] = useState(false);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [editedName, setEditedName] = useState(paramGroupName || '');
  const [saving, setSaving] = useState(false);
  const [profilePicVisible, setProfilePicVisible] = useState(false);
  const [pickedProfilePicUri, setPickedProfilePicUri] = useState<string | null>(null);
  const [bannerModalVisible, setBannerModalVisible] = useState(false);
  const [pickedBannerUri, setPickedBannerUri] = useState<string | null>(null);

  // Track locally updated values
  const [localGroupName, setLocalGroupName] = useState(paramGroupName);
  const [localImageUrl, setLocalImageUrl] = useState(groupImageUrl);
  const [localBannerUri, setLocalBannerUri] = useState<string | null>(null);

  const groupName = localGroupName || `Group #${groupId}`;
  const isAdmin = ADMIN_ROLES.includes((groupRole || '').toLowerCase());
  useScreenAnnouncement(`${groupName} group profile`);

  // Running stats derivation
  const findEmotion = (emotionStatesId: number | undefined | null) =>
    emotionStatesId ? emotionStates.find(e => e.xanoId === emotionStatesId) : undefined;

  const directions = [
    { label: 'Daily', data: runningStats?.direction_t_p, themeColour: findEmotion(runningStats?.todays_average?.emotion_states_id)?.themeColour },
    { label: '7 Day', data: runningStats?.direction_w1_w2, themeColour: findEmotion(runningStats?.w1?.emotion_states_id)?.themeColour },
    { label: '30 Day', data: runningStats?.direction_m1_m2, themeColour: findEmotion(runningStats?.m1?.emotion_states_id)?.themeColour },
    { label: 'All Time', data: runningStats?.direction_m1_at, themeColour: findEmotion(runningStats?.at?.emotion_states_id)?.themeColour },
  ];

  const todaysAverage = runningStats?.todays_average;
  const previousAverage = runningStats?.previous_average;
  const totalCheckins = runningStats?.checkInCount ?? 'N/A';
  const dailyCheckinPercent = runningStats?.daily_checkin_percent != null
    ? `${Math.round(runningStats.daily_checkin_percent)}%` : 'N/A';
  const weeklyCheckinPercent = runningStats?.weekly_checkin_percent != null
    ? `${Math.round(runningStats.weekly_checkin_percent)}%` : 'N/A';
  const modeEmotion = runningStats?.checkInMode?.emotionText;
  const modeEmotionColour = findEmotion(runningStats?.checkInMode?.emotion_states_id)?.emotionColour ?? colors.textPlaceholder;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setMembersLoading(true);
        const data = await getMembers(groupId);
        if (!cancelled && data) setMembers(data);
        if (!cancelled) setMembersLoading(false);
      })();
      return () => { cancelled = true; };
    }, [groupId, getMembers])
  );

  const rawCheckinData = useMemo(() => {
    if (pulsePeriod === '7 Days') return checkins7day ?? [];
    if (pulsePeriod === '30 Days') return checkins30day ?? [];
    return membersCoordinatesCount ?? [];
  }, [pulsePeriod, checkins7day, checkins30day, membersCoordinatesCount]);

  const { densityData } = useCoordinateMapping(coordinates, rawCheckinData);

  const { pendingCheckIn, handleCellPress, confirmCheckIn, cancelCheckIn } = useQuickCheckIn(
    () => (navigation as any).navigate('DailyInsight')
  );

  // Admin actions
  const handleSaveGroupName = async () => {
    const trimmed = editedName.trim();
    if (!trimmed) return;
    setSaving(true);
    const result = await updateGroupName(groupId, trimmed);
    setSaving(false);
    if (result) {
      setLocalGroupName(trimmed);
      setEditNameVisible(false);
    } else {
      Alert.alert('Error', 'Failed to update group name.');
    }
  };

  const handlePickProfilePic = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPickedProfilePicUri(result.assets[0].uri);
    }
  };

  const handleSaveProfilePic = async () => {
    if (!pickedProfilePicUri) return;
    const ext = pickedProfilePicUri.split('.').pop()?.toLowerCase() || 'jpeg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    setSaving(true);
    const res = await updateProfilePic(groupId, { uri: pickedProfilePicUri, name: `group_profile.${ext}`, type: mime });
    setSaving(false);
    if (res) {
      setLocalImageUrl(pickedProfilePicUri);
      setPickedProfilePicUri(null);
      setProfilePicVisible(false);
    } else {
      Alert.alert('Error', 'Failed to update profile picture.');
    }
  };

  const handlePickBanner = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPickedBannerUri(result.assets[0].uri);
    }
  };

  const handleSaveBanner = async () => {
    if (!pickedBannerUri) return;
    const ext = pickedBannerUri.split('.').pop()?.toLowerCase() || 'jpeg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    setSaving(true);
    const res = await updateBanner(groupId, { uri: pickedBannerUri, name: `group_banner.${ext}`, type: mime });
    setSaving(false);
    if (res) {
      setLocalBannerUri(pickedBannerUri);
      setPickedBannerUri(null);
      setBannerModalVisible(false);
    } else {
      Alert.alert('Error', 'Failed to update banner.');
    }
  };

  const bannerSource = localBannerUri ? { uri: localBannerUri } : bannerImage;

  return (
    <View style={styles.container}>
      <ImageBackground source={bannerSource} style={styles.headerBg} resizeMode="cover">
        <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)']} style={StyleSheet.absoluteFill} />
      </ImageBackground>

      <SafeAreaView style={styles.safe}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton}>
            <ArrowLeft color={colors.textOnPrimary} size={24} />
          </TouchableOpacity>
          <View style={styles.navRight}>
            {isAdmin && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => navigation.navigate('GroupInvite', { groupId, groupName })}
              >
                <UserPlus color={colors.textOnPrimary} size={24} />
              </TouchableOpacity>
            )}
            {isAdmin && (
              <TouchableOpacity style={styles.navButton} onPress={() => setMenuVisible(true)}>
                <MoreHorizontal color={colors.textOnPrimary} size={24} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.profileHeader}>
          <View style={styles.avatarRow}>
            {localImageUrl ? (
              <Image source={{ uri: localImageUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarInitial}>{groupName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.displayName} numberOfLines={1}>{groupName}</Text>
          <View style={styles.tags}>
            {groupRole ? (
              <View style={styles.tag}><Text style={styles.tagText}>{groupRole}</Text></View>
            ) : null}
            <View style={styles.tag}><Text style={styles.tagText}>{members.length} Members</Text></View>
          </View>
        </View>

        <ProfileTabs
          tabs={['Pulse', 'Outlook', 'Members'] as const}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'Pulse' && (
            <View style={styles.pulseContent}>
              <View style={[pillTabStyles.row, styles.pillRowMargin]}>
                {(['Today', '7 Days', '30 Days'] as const).map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[pillTabStyles.pill, pulsePeriod === period && pillTabStyles.pillActive]}
                    onPress={() => setPulsePeriod(period)}
                  >
                    <Text style={[pillTabStyles.pillLabel, pulsePeriod === period && pillTabStyles.pillLabelActive]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.pulseGridWrap}>
                <PulseGrid mode="group" isInteractive={false}>
                  <View style={StyleSheet.absoluteFill}>
                    <CoordinatesGrid visualizationMode="group" densityData={densityData} />
                  </View>
                  <PairsAvatarOverlay
                    points={[]}
                    onUserPress={() => {}}
                    onCellPress={handleCellPress}
                  />
                </PulseGrid>
              </View>
            </View>
          )}
          {activeTab === 'Outlook' && (
            <GroupOutlookTab
              directions={directions}
              previousAverage={previousAverage}
              todaysAverage={todaysAverage}
              dailyCheckinPercent={dailyCheckinPercent}
              weeklyCheckinPercent={weeklyCheckinPercent}
              totalCheckins={totalCheckins}
              modeEmotion={modeEmotion}
              modeEmotionColour={modeEmotionColour}
            />
          )}
          {activeTab === 'Members' && (
            <GroupMembersTab members={members} membersLoading={membersLoading} />
          )}
        </ScrollView>
      </SafeAreaView>

      <GroupAdminModals
        menuVisible={menuVisible}
        onCloseMenu={() => setMenuVisible(false)}
        onEditName={() => { setMenuVisible(false); setEditedName(groupName); setEditNameVisible(true); }}
        onEditProfilePic={() => { setMenuVisible(false); setPickedProfilePicUri(null); setProfilePicVisible(true); }}
        onEditBanner={() => { setMenuVisible(false); setPickedBannerUri(null); setBannerModalVisible(true); }}
        editNameVisible={editNameVisible}
        editedName={editedName}
        onEditedNameChange={setEditedName}
        onCloseEditName={() => setEditNameVisible(false)}
        onSaveGroupName={handleSaveGroupName}
        profilePicVisible={profilePicVisible}
        pickedProfilePicUri={pickedProfilePicUri}
        onCloseProfilePic={() => setProfilePicVisible(false)}
        onPickProfilePic={handlePickProfilePic}
        onSaveProfilePic={handleSaveProfilePic}
        bannerModalVisible={bannerModalVisible}
        pickedBannerUri={pickedBannerUri}
        onCloseBanner={() => setBannerModalVisible(false)}
        onPickBanner={handlePickBanner}
        onSaveBanner={handleSaveBanner}
        saving={saving}
      />

      {saving && !editNameVisible && !profilePicVisible && !bannerModalVisible && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={colors.textOnPrimary} />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}

      {pendingCheckIn && (
        <CheckInConfirmModal
          emotion={pendingCheckIn.emotion}
          onConfirm={confirmCheckIn}
          onCancel={cancelCheckIn}
        />
      )}
    </View>
  );
}
