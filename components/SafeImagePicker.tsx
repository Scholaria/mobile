import * as ImagePicker from "expo-image-picker";
import { Alert, Linking, Platform } from "react-native";

interface SafeImagePickerOptions {
  mediaTypes?: ImagePicker.MediaTypeOptions;
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
  base64?: boolean;
}

interface SafeImagePickerResult {
  success: boolean;
  data?: {
    base64: string;
    uri: string;
    width: number;
    height: number;
  };
  error?: string;
}

export class SafeImagePicker {
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log("Requesting media library permissions...");
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Permission status:", permission.status);
      console.log("Permission granted:", permission.granted);
      console.log("Permission canAskAgain:", permission.canAskAgain);
      return permission.status === "granted";
    } catch (error) {
      console.error("Permission request failed:", error);
      return false;
    }
  }

  static async pickImage(options: SafeImagePickerOptions = {}): Promise<SafeImagePickerResult> {
    try {
      console.log("Starting image picker...");
      
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      console.log("Has permission:", hasPermission);
      
      if (!hasPermission) {
        console.log("Permission denied, showing alert...");
        Alert.alert(
          "Permission Required", 
          "We need permission to access your photos. Please enable photo access in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() }
          ]
        );
        return { success: false, error: "Permission denied" };
      }

      // Configure picker options with iPad-specific optimizations
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
        quality: options.quality || 0.7,
        allowsEditing: options.allowsEditing !== false,
        aspect: options.aspect || [1, 1],
        base64: options.base64 !== false,
        presentationStyle: Platform.OS === 'ios' 
          ? ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN 
          : undefined,
      };

      console.log("Launching image library with options:", pickerOptions);
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      console.log("Image picker result:", result);
      
      if (result.canceled) {
        console.log("User cancelled image picker");
        return { success: false, error: "User cancelled" };
      }

      // Validate result
      if (!result.assets || result.assets.length === 0) {
        return { success: false, error: "No image selected" };
      }

      const asset = result.assets[0];
      
      // Validate required data
      if (!asset.base64) {
        return { success: false, error: "Failed to get image data" };
      }

      return {
        success: true,
        data: {
          base64: asset.base64,
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        }
      };

    } catch (error) {
      console.error("ImagePicker error:", error);
      
      let errorMessage = "Failed to pick image";
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        if (error.message.includes("permission")) {
          errorMessage = "Permission denied";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error";
        } else if (error.message.includes("cancelled")) {
          errorMessage = "User cancelled";
        } else if (error.message.includes("TCC")) {
          errorMessage = "Privacy settings blocked access";
        }
      }
      
      return { success: false, error: errorMessage };
    }
  }

  static async takePhoto(options: SafeImagePickerOptions = {}): Promise<SafeImagePickerResult> {
    try {
      // Request camera permissions
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Camera Permission Required", 
          "We need permission to access your camera to take photos. Please enable camera access in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() }
          ]
        );
        return { success: false, error: "Camera permission denied" };
      }

      // Configure camera options
      const cameraOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
        quality: options.quality || 0.7,
        allowsEditing: options.allowsEditing !== false,
        aspect: options.aspect || [1, 1],
        base64: options.base64 !== false,
        presentationStyle: Platform.OS === 'ios' 
          ? ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN 
          : undefined,
      };

      const result = await ImagePicker.launchCameraAsync(cameraOptions);
      
      if (result.canceled) {
        return { success: false, error: "User cancelled" };
      }

      // Validate result
      if (!result.assets || result.assets.length === 0) {
        return { success: false, error: "No photo taken" };
      }

      const asset = result.assets[0];
      
      // Validate required data
      if (!asset.base64) {
        return { success: false, error: "Failed to get photo data" };
      }

      return {
        success: true,
        data: {
          base64: asset.base64,
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        }
      };

    } catch (error) {
      console.error("Camera error:", error);
      
      let errorMessage = "Failed to take photo";
      if (error instanceof Error) {
        if (error.message.includes("permission")) {
          errorMessage = "Camera permission denied";
        } else if (error.message.includes("cancelled")) {
          errorMessage = "User cancelled";
        }
      }
      
      return { success: false, error: errorMessage };
    }
  }
} 