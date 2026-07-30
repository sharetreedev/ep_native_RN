import * as ImagePicker from 'expo-image-picker';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { logger } from './logger';

export interface PickImageOptions {
  /** Crop aspect ratio passed to expo-image-picker. Only applies when
   *  `allowsEditing` is true. */
  aspect?: [number, number];
  /** 0–1, defaults to 0.8 (matches existing call sites). */
  quality?: number;
  /**
   * Show the built-in crop/rotate editor after selection. Defaults to true.
   *
   * ⚠️ Setting this to `false` uploads the asset AS-IS, which on iOS is very often
   * **HEIC** — and Xano's `storage.create_image` rejects it with
   * "Invalid file extension." The crop editor was doubling as a format normaliser:
   * it re-encodes to JPEG on the way out, which is why uploads worked with it on.
   *
   * There is no OTA-safe way to transcode — `expo-image-manipulator` is a native
   * module, so enabling this properly needs it added and a NEW BINARY BUILD, not an
   * OTA. Until then, leave editing on for any path that uploads to Xano.
   */
  allowsEditing?: boolean;
}

/**
 * A picked image plus the metadata the OS picker reported about it. We keep
 * `mimeType`/`fileName` rather than throwing them away because the multipart
 * upload needs the *real* content type — see `toUploadFile`.
 */
export interface PickedImage {
  /** Local file URI of the (possibly cropped) image. */
  uri: string;
  /** MIME type the OS picker reported (e.g. 'image/png'). Undefined on some devices. */
  mimeType?: string;
  /** Original file name the picker reported. Undefined on some devices. */
  fileName?: string;
}

/**
 * Present a "Take Photo / Choose from Library" chooser and return the
 * selected image (uri + picker-reported metadata), or null if the user
 * cancelled or denied permission.
 *
 * Camera permission is requested lazily on first use — most users only
 * ever pick from the library, so we don't want to ask for camera access
 * upfront.
 */
export async function pickImage(opts: PickImageOptions = {}): Promise<PickedImage | null> {
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
    const allowsEditing = opts.allowsEditing ?? true;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing,
      aspect: allowsEditing ? opts.aspect : undefined,
      quality: opts.quality ?? 0.8,
    });
    if (result.canceled || !result.assets[0]) return null;
    return toPickedImage(result.assets[0]);
  }

  const allowsEditing = opts.allowsEditing ?? true;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing,
    aspect: allowsEditing ? opts.aspect : undefined,
    quality: opts.quality ?? 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;
  return toPickedImage(result.assets[0]);
}

function toPickedImage(asset: ImagePicker.ImagePickerAsset): PickedImage {
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? undefined,
    fileName: asset.fileName ?? undefined,
  };
}

// Maps the picker-reported MIME type to the file extension we tag the upload
// with. Keeps the multipart filename's extension consistent with its declared
// content type.
const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
};

/**
 * Build the `{ uri, name, type }` descriptor React Native's FormData needs for
 * a multipart upload, preferring the MIME type/filename the OS picker reported
 * and only falling back to a URI-extension guess when they're missing.
 *
 * Every call site used to infer the type purely from the URI string
 * (`uri.split('.').pop()`), which silently mislabelled PNG/WebP/HEIC picks as
 * `image/jpeg` on any device whose picked URI lacked a clean extension. Xano's
 * `storage.create_image` rejects a declared-type/actual-bytes mismatch, so
 * that misinference was a likely cause of profile-picture uploads failing on
 * Android. Trusting the picker's own metadata removes the guess.
 */
export function toUploadFile(
  img: PickedImage,
  fallbackBaseName: string,
): { uri: string; name: string; type: string } {
  const uriExt = img.uri.split('.').pop()?.split(/[?;#]/)[0]?.toLowerCase();
  const type =
    img.mimeType ??
    (uriExt === 'png' ? 'image/png'
      : uriExt === 'webp' ? 'image/webp'
      : uriExt === 'heic' || uriExt === 'heif' ? 'image/heic'
      : 'image/jpeg');
  const ext =
    (img.mimeType && MIME_TO_EXT[img.mimeType]) ||
    (uriExt && /^[a-z0-9]{2,5}$/.test(uriExt) ? uriExt : 'jpg');
  // Build the name from the picker's BASE name but always re-apply OUR resolved
  // extension. Previously this used `img.fileName` verbatim, which reintroduced
  // whatever the OS reported — including uppercase iOS extensions like
  // "IMG_0004.HEIC" — bypassing all the lowercase normalisation above and sending
  // Xano a filename whose extension didn't match the declared content type.
  // Xano's storage.create_image validates the extension and rejects a mismatch
  // with "Invalid file extension."
  const base = img.fileName
    ? img.fileName.replace(/\.[^.]+$/, '') || fallbackBaseName
    : fallbackBaseName;
  const name = `${base}.${ext}`;

  // Dev-only: logger.info is a no-op outside __DEV__. Kept because the upload's
  // declared type/extension is invisible in the network log and is exactly what
  // storage.create_image rejects on.
  logger.info('[toUploadFile]', JSON.stringify({
    sent_name: name,
    sent_type: type,
    picker_mimeType: img.mimeType ?? null,
    picker_fileName: img.fileName ?? null,
    uri_ext: uriExt ?? null,
  }));
  return { uri: img.uri, name, type };
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
