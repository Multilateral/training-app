import * as ImagePicker from 'expo-image-picker';
import { toByteArray } from 'base64-js';
import { supabase } from '../context/TrainingContext';
import { Alert, Platform } from 'react-native';

export interface AvatarUploadResult {
  avatarUrl: string;
}

/**
 * Prompts user to pick or take a photo, uploads it to Supabase Storage 'avatars' bucket,
 * and updates public.user_profiles.avatar_url so it is immediately synchronized with NutraLife.
 */
export async function pickAndUploadAvatar(
  userId: string,
  useCamera: boolean = false,
  workspacesData: any = {}
): Promise<string | null> {
  if (!userId) {
    Alert.alert('Error', 'User ID is required to update profile photo.');
    return null;
  }

  try {
    // 1. Request permissions
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is required to take a profile picture.');
        return null;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is required to choose a profile picture.');
        return null;
      }
    }

    // 2. Launch ImagePicker
    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    };

    const result = useCamera
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions);

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Error', 'Could not process selected image data.');
      return null;
    }

    // 3. Convert base64 to byte array
    const byteArray = toByteArray(asset.base64);
    const fileName = `${userId}/avatar_${Date.now()}.jpg`;

    // 4. Upload to Supabase Storage 'avatars' bucket
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, byteArray, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('[AvatarManager] Storage upload error:', uploadError);
      Alert.alert('Upload Failed', uploadError.message || 'Could not upload photo to cloud storage.');
      return null;
    }

    // 5. Get Public URL
    const { data: publicData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    if (!publicData?.publicUrl) {
      Alert.alert('Error', 'Could not obtain public URL for uploaded photo.');
      return null;
    }

    // Add cache buster
    const finalAvatarUrl = `${publicData.publicUrl}?v=${Date.now()}`;

    // 6. Update user_profiles in Supabase so NutraLife and Training App stay unified
    const updatedWorkspaces = {
      ...(workspacesData || {}),
      avatar: finalAvatarUrl,
    };

    const { error: dbError } = await supabase
      .from('user_profiles')
      .update({
        avatar_url: finalAvatarUrl,
        workspaces_data: updatedWorkspaces,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (dbError) {
      console.warn('[AvatarManager] Warning updating user_profiles avatar_url:', dbError);
    }

    return finalAvatarUrl;
  } catch (err: any) {
    console.error('[AvatarManager] Unexpected avatar upload exception:', err);
    Alert.alert('Error', err?.message || 'An unexpected error occurred while updating profile photo.');
    return null;
  }
}
