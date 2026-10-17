import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import type { Shot } from '@/services/api';

// base64 lets us upload straight to Supabase Storage without extra file-system modules.
const OPTS: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.7, base64: true };

function denied(what: string) {
  Alert.alert(`${what} access is off`, `Allow ${what.toLowerCase()} access in Settings to continue.`, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
}

const toShot = (r: ImagePicker.ImagePickerResult): Shot | null => {
  const a = r.canceled ? null : r.assets[0];
  return a ? { uri: a.uri, base64: a.base64, mimeType: a.mimeType } : null;
};

export async function pickFromLibrary(): Promise<Shot | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    denied('Photo library');
    return null;
  }
  return toShot(await ImagePicker.launchImageLibraryAsync(OPTS));
}

export async function takePhoto(opts?: { front?: boolean; square?: boolean }): Promise<Shot | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    denied('Camera');
    return null;
  }
  try {
    return toShot(
      await ImagePicker.launchCameraAsync({
        ...OPTS,
        aspect: opts?.square ? [1, 1] : OPTS.aspect,
        cameraType: opts?.front ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      }),
    );
  } catch {
    // Simulators have no camera — fall back to the library so the flow can still be completed.
    return pickFromLibrary();
  }
}
