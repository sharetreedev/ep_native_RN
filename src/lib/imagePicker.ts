import * as ImagePicker from 'expo-image-picker';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

export interface PickImageOptions {
  /** Crop aspect ratio passed to expo-image-picker. */
  aspect?: [number, number];
  /** 0–1, defaults to 0.8 (matches existing call sites). */
  quality?: number;
}

/**
 * Present a "Take Photo / Choose from Library" chooser and return the
 * selected image URI, or null if the user cancelled or denied permission.
 *
 * Camera permission is requested lazily on first use — most users only
 * ever pick from the library, so we don't want to ask for camera access
 * upfront.
 */
export async function pickImage(opts: PickImageOptions = {}): Promise<string | null> {
  const choice = await chooseSource();
  if (!choice) return null;

  if (choice === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Camera access needed',
        'Enable camera access for Emotional Pulse in Settings to take a photo.',
      );
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: opts.aspect,
      quality: opts.quality ?? 0.8,
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: opts.aspect,
    quality: opts.quality ?? 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

type Source = 'camera' | 'library';

function chooseSource(): Promise<Source | null> {
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) resolve('camera');
          else if (idx === 2) resolve('library');
          else resolve(null);
        },
      );
    });
  }
  return new Promise((resolve) => {
    Alert.alert(
      'Add a photo',
      undefined,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        { text: 'Take Photo', onPress: () => resolve('camera') },
        { text: 'Choose from Library', onPress: () => resolve('library') },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}
