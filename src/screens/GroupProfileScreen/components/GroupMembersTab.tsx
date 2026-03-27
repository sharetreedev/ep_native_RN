import React from 'react';
import { View, Text, Image } from 'react-native';
import { styles } from '../styles';
import PulseLoader from '../../../components/PulseLoader';

interface GroupMembersTabProps {
  members: any[];
  membersLoading: boolean;
}

export default function GroupMembersTab({ members, membersLoading }: GroupMembersTabProps) {
  return (
    <View style={styles.membersContent}>
      {membersLoading ? (
        <PulseLoader style={{ marginTop: 40, flex: 0, height: 120 }} />
      ) : members.length === 0 ? (
        <Text style={styles.emptyText}>No members found</Text>
      ) : (
        members.map((member: any, index: number) => {
          const name = member.user?.fullName || `Member #${member.id}`;
          const avatarUrl = member.user?.profilePic_url;
          const initial = (name || '?').charAt(0).toUpperCase();
          const isLast = index === members.length - 1;

          return (
            <View
              key={`member-${member.id ?? index}`}
              style={[styles.memberRow, !isLast && styles.memberRowBorder]}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.memberAvatar} />
              ) : (
                <View style={styles.memberAvatarPlaceholder}>
                  <Text style={styles.memberAvatarInitial}>{initial}</Text>
                </View>
              )}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{name}</Text>
                {member.role && (
                  <Text style={styles.memberRole}>{(member.role as string).replace(/\b\w/g, (c: string) => c.toUpperCase())}</Text>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
