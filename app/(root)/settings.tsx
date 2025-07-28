import { icons } from "@/constants";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import * as React from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, TextInput } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import { fetchAPI } from '@/lib/fetch';
import { Picker } from "@react-native-picker/picker";
import { showErrorNotification } from "@/components/ErrorNotification";
import { SafeImagePicker } from "@/components/SafeImagePicker";

const Settings = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [userData, setUserData] = useState<any>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchUserData = async (skipCache = false) => {
    try {
      const result = await fetchAPI(`/user/${user?.id}`, { skipCache });
      if (result && result.data) {
        setUserData(result.data);
        // Initialize form fields
        setName(result.data.name || "");
        setRole(result.data.role || "User");
        setInterests(result.data.interests || []);
      } else {
        console.error("Error fetching user data:", result?.error || "No data returned");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const pickImageAndUpload = async () => {
    try {
      setUploading(true);
      
      // Use SafeImagePicker for better error handling and iPad compatibility
      const result = await SafeImagePicker.pickImage({
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });
      
      if (!result.success) {
        Alert.alert("Upload Error", result.error || "Failed to pick image");
        return;
      }
      
      if (!result.data?.base64) {
        Alert.alert("Upload Error", "Failed to get image data");
        return;
      }
  
      // Upload to Clerk with better error handling
      await user?.setProfileImage({ file: `data:image/jpeg;base64,${result.data.base64}` });
      await user?.reload(); // refresh Clerk session data
      await fetchUserData(true); // re-fetch backend userData
  
    } catch (err) {
      console.error("Image upload error:", err);
      Alert.alert("Upload Error", "There was an error uploading your image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const addInterest = () => {
    const trimmed = newInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests((prev) => prev.filter((i) => i !== interest));
  };

  const saveProfile = async () => {
    if (!user?.id) return;

    // Validate required fields
    if (!name.trim()) {
      showErrorNotification("Please enter your name", "Missing Information");
      return;
    }

    setSaving(true);
    try {
      const response = await fetchAPI(`/user/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          interests,
          role,
          profile_image_url: user.imageUrl,
        }),
      });
      
      if (response) {
        // console.log("Profile update successful:", response);
      }
      await fetchUserData(true); // Refresh user data
      showErrorNotification("Profile updated successfully!", "Success");
    } catch (err) {
      console.error("Failed to update profile:", err);
      showErrorNotification("Could not save profile. Please try again.", "Profile Update Error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword || !confirmPassword || !currentPassword) {
      showErrorNotification("Please fill in all password fields", "Missing Information");
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorNotification("New passwords do not match", "Password Mismatch");
      return;
    }

    if (newPassword.length < 8) {
      showErrorNotification("New password must be at least 8 characters long", "Password Too Short");
      return;
    }

    setChangingPassword(true);
    try {
      // Note: This would need to be implemented with Clerk's password change API
      // For now, we'll show a placeholder
      Alert.alert(
        "Password Change",
        "Password change functionality would be implemented here using Clerk's API. Please contact support for password changes.",
        [{ text: "OK" }]
      );
      setShowPasswordFields(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Failed to change password:", err);
      showErrorNotification("Could not change password. Please try again.", "Password Change Error");
    } finally {
      setChangingPassword(false);
    }
  };

  const deleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete user from backend
              await fetchAPI(`/user/${user?.id}`, {
                method: "DELETE",
              });
              
              // Delete user from Clerk
              await user?.delete();
              
              // Sign out and redirect
              await signOut();
              router.replace("/(auth)/sign-in");
            } catch (err) {
              console.error("Failed to delete account:", err);
              showErrorNotification("Could not delete account. Please try again.", "Delete Error");
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  return (
    <SafeAreaView className="flex-1 bg-primary-800">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-8 pb-6 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="justify-center items-center w-10 h-10 rounded-full bg-primary-700 shadow-sm"
          >
            <Icon name="arrow-left" size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-xl font-JakartaBold text-white">Settings</Text>
          <View className="w-10" />
        </View>

        <View className="px-6 space-y-6 pb-8">
          {/* Profile Picture Section */}
          <View className="bg-primary-700 rounded-xl p-6 shadow-sm mb-8">
            <View className="items-center">
              <TouchableOpacity 
                onPress={pickImageAndUpload}
                className="w-20 h-20 rounded-full bg-primary-600 mb-4 items-center justify-center overflow-hidden"
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : user?.imageUrl ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    className="w-20 h-20 rounded-full"
                  />
                ) : (
                  <Text className="text-2xl text-gray-300 font-JakartaMedium">
                    {userData?.name?.[0] || user?.firstName?.[0] || "?"}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickImageAndUpload}
                className="bg-secondary-100 rounded-lg px-4 py-2"
              >
                <Text className="text-secondary-600 font-JakartaMedium text-sm">Change Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Information Section */}
          <View className="bg-primary-700 rounded-xl p-6 shadow-sm mb-8">
            <Text className="text-lg font-JakartaBold text-white mb-6">Profile</Text>
            
            {/* Name */}
            <View className="mb-5">
              <Text className="text-sm font-JakartaMedium text-gray-200 mb-2">Full Name</Text>
              <TextInput
                className="border border-primary-600 rounded-lg p-3 text-white font-JakartaMedium bg-primary-600"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Role */}
            <View className="mb-5">
              <Text className="text-sm font-JakartaMedium text-gray-200 mb-2">Role</Text>
              <View className="border border-primary-600 rounded-lg bg-primary-600">
                <Picker
                  selectedValue={role}
                  onValueChange={(value) => setRole(value)}
                  style={{ color: '#ffffff' }}
                >
                  <Picker.Item label="Student" value="Student" color="#ffffff" />
                  <Picker.Item label="Researcher" value="Researcher" color="#ffffff" />
                  <Picker.Item label="Professor" value="Professor" color="#ffffff" />
                  <Picker.Item label="Industry" value="Industry" color="#ffffff" />
                  <Picker.Item label="Other" value="Other" color="#ffffff" />
                </Picker>
              </View>
            </View>

            {/* Interests */}
            <View className="mb-6">
              <Text className="text-sm font-JakartaMedium text-gray-200 mb-2">Research Interests</Text>
              <View className="flex-row mb-3">
                <TextInput
                  className="flex-1 border border-primary-600 rounded-lg p-3 mr-2 bg-primary-600 text-white font-JakartaMedium"
                  value={newInterest}
                  onChangeText={setNewInterest}
                  placeholder="Add new interest..."
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  onPress={addInterest}
                  className="bg-secondary-500 px-4 rounded-lg justify-center"
                >
                  <Text className="text-white font-JakartaMedium text-sm">Add</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row flex-wrap">
                {interests.map((interest, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => removeInterest(interest)}
                    className="bg-secondary-100 rounded-full px-3 py-1.5 m-1"
                  >
                    <Text className="text-secondary-700 text-sm font-JakartaMedium">
                      {interest} ×
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={saveProfile}
              disabled={saving}
              className="bg-secondary-500 rounded-lg py-3.5"
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-JakartaMedium">Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Password Section */}
          <View className="bg-primary-700 rounded-xl p-6 shadow-sm mb-8">
            <Text className="text-lg font-JakartaBold text-white mb-6">Security</Text>
            
            {!showPasswordFields ? (
              <TouchableOpacity
                onPress={() => setShowPasswordFields(true)}
                className="bg-primary-600 rounded-lg py-3.5 border border-primary-500"
              >
                <Text className="text-gray-200 text-center font-JakartaMedium">Change Password</Text>
              </TouchableOpacity>
            ) : (
              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-JakartaMedium text-gray-200 mb-2">Current Password</Text>
                  <TextInput
                    className="border border-primary-600 rounded-lg p-3 text-white font-JakartaMedium bg-primary-600"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                  />
                </View>
                
                <View>
                  <Text className="text-sm font-JakartaMedium text-gray-200 mb-2">New Password</Text>
                  <TextInput
                    className="border border-primary-600 rounded-lg p-3 text-white font-JakartaMedium bg-primary-600"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                  />
                </View>
                
                <View>
                  <Text className="text-sm font-JakartaMedium text-gray-200 mb-2">Confirm New Password</Text>
                  <TextInput
                    className="border border-primary-600 rounded-lg p-3 text-white font-JakartaMedium bg-primary-600"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                  />
                </View>
                
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => {
                      setShowPasswordFields(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="flex-1 bg-primary-600 rounded-lg py-3.5 border border-primary-500"
                  >
                    <Text className="text-gray-200 text-center font-JakartaMedium">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={changePassword}
                    disabled={changingPassword}
                    className="flex-1 bg-secondary-500 rounded-lg py-3.5"
                  >
                    {changingPassword ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white text-center font-JakartaMedium">Update</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Account Actions Section */}
          <View className="bg-primary-700 rounded-xl p-6 shadow-sm mb-8">
            <Text className="text-lg font-JakartaBold text-white mb-6">Account</Text>
            
            <TouchableOpacity
              onPress={() => {
                signOut();
                router.replace("/(auth)/sign-in");
              }}
              className="bg-orange-50 rounded-lg py-3.5 mb-4 border border-orange-200"
            >
              <Text className="text-orange-600 text-center font-JakartaMedium">Sign Out</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={deleteAccount}
              className="bg-red-50 rounded-lg py-3.5 border border-red-200"
            >
              <Text className="text-red-600 text-center font-JakartaMedium">Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings; 