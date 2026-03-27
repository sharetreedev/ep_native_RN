import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { colors } from '../../../theme';
import { styles } from '../styles';

interface GroupAdminModalsProps {
  // Menu modal
  menuVisible: boolean;
  onCloseMenu: () => void;
  onEditName: () => void;
  onEditProfilePic: () => void;
  onEditBanner: () => void;

  // Edit name modal
  editNameVisible: boolean;
  editedName: string;
  onEditedNameChange: (text: string) => void;
  onCloseEditName: () => void;
  onSaveGroupName: () => void;

  // Profile pic modal
  profilePicVisible: boolean;
  pickedProfilePicUri: string | null;
  onCloseProfilePic: () => void;
  onPickProfilePic: () => void;
  onSaveProfilePic: () => void;

  // Banner modal
  bannerModalVisible: boolean;
  pickedBannerUri: string | null;
  onCloseBanner: () => void;
  onPickBanner: () => void;
  onSaveBanner: () => void;

  saving: boolean;
}

export default function GroupAdminModals({
  menuVisible,
  onCloseMenu,
  onEditName,
  onEditProfilePic,
  onEditBanner,
  editNameVisible,
  editedName,
  onEditedNameChange,
  onCloseEditName,
  onSaveGroupName,
  profilePicVisible,
  pickedProfilePicUri,
  onCloseProfilePic,
  onPickProfilePic,
  onSaveProfilePic,
  bannerModalVisible,
  pickedBannerUri,
  onCloseBanner,
  onPickBanner,
  onSaveBanner,
  saving,
}: GroupAdminModalsProps) {
  return (
    <>
      {/* Ellipsis Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={onCloseMenu}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuSheet}>
                <TouchableOpacity style={styles.menuItem} onPress={onEditName}>
                  <Text style={styles.menuItemText}>Edit Group Name</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={onEditProfilePic}>
                  <Text style={styles.menuItemText}>Update Profile Picture</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={onEditBanner}>
                  <Text style={styles.menuItemText}>Update Banner</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={onCloseMenu}>
                  <Text style={[styles.menuItemText, styles.menuCancelText]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Group Name Modal */}
      <Modal visible={editNameVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={onCloseEditName}>
          <View style={styles.editOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.editSheet}>
                <Text style={styles.editTitle}>Edit Group Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedName}
                  onChangeText={onEditedNameChange}
                  placeholder="Group name"
                  placeholderTextColor={colors.textPlaceholder}
                  autoFocus
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.editCancelBtn} onPress={onCloseEditName}>
                    <Text style={styles.editCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editSaveBtn, saving && { opacity: 0.6 }]}
                    onPress={onSaveGroupName}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.textOnPrimary} size="small" />
                    ) : (
                      <Text style={styles.editSaveText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Update Profile Picture Modal */}
      <Modal visible={profilePicVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={onCloseProfilePic}>
          <View style={styles.editOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.editSheet}>
                <Text style={styles.editTitle}>Update Profile Picture</Text>
                {pickedProfilePicUri ? (
                  <Image source={{ uri: pickedProfilePicUri }} style={styles.picPreview} />
                ) : (
                  <View style={styles.picPlaceholder}>
                    <Text style={styles.picPlaceholderText}>No image selected</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.pickImageBtn} onPress={onPickProfilePic}>
                  <Text style={styles.pickImageBtnText}>Choose Image</Text>
                </TouchableOpacity>
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.editCancelBtn} onPress={onCloseProfilePic}>
                    <Text style={styles.editCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editSaveBtn, (!pickedProfilePicUri || saving) && { opacity: 0.6 }]}
                    onPress={onSaveProfilePic}
                    disabled={!pickedProfilePicUri || saving}
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.textOnPrimary} size="small" />
                    ) : (
                      <Text style={styles.editSaveText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Update Banner Modal */}
      <Modal visible={bannerModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={onCloseBanner}>
          <View style={styles.editOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.editSheet}>
                <Text style={styles.editTitle}>Update Banner</Text>
                {pickedBannerUri ? (
                  <Image source={{ uri: pickedBannerUri }} style={styles.bannerPreview} />
                ) : (
                  <View style={styles.bannerPlaceholder}>
                    <Text style={styles.picPlaceholderText}>No image selected</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.pickImageBtn} onPress={onPickBanner}>
                  <Text style={styles.pickImageBtnText}>Choose Image</Text>
                </TouchableOpacity>
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.editCancelBtn} onPress={onCloseBanner}>
                    <Text style={styles.editCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editSaveBtn, (!pickedBannerUri || saving) && { opacity: 0.6 }]}
                    onPress={onSaveBanner}
                    disabled={!pickedBannerUri || saving}
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.textOnPrimary} size="small" />
                    ) : (
                      <Text style={styles.editSaveText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
