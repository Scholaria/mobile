import CustomButton from "@/components/CustomButton";
import { fetchAPI, clearCacheByPattern } from "@/lib/fetch";
import { getCategoryDisplayName, getCategoryCode } from "@/lib/categoryMapping";
import { useUser } from "@clerk/clerk-expo";
import { Picker } from "@react-native-picker/picker";
import Constants from "expo-constants";
import { router, Redirect } from "expo-router";
import { useState, useEffect } from "react";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { showErrorNotification } from "@/components/ErrorNotification";
import { SafeImagePicker } from "@/components/SafeImagePicker";


const Setup = () => {

  const { user } = useUser();
  const [name, setName] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [role, setRole] = useState<string>("User");
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableKeywords, setAvailableKeywords] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [shouldRedirect, setShouldRedirect] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState<boolean>(true);

  // Fetch available categories and keywords on component mount
  useEffect(() => {
    // console.log('Setup component mounted, fetching categories and keywords');
    fetchAvailableCategoriesAndKeywords();
    fetchUserData();
  }, []);

  // Debug user object changes
  useEffect(() => {
    // console.log("🔍 Setup: User object changed:", {
    //   userExists: !!user,
    //   userId: user?.id,
    //   userEmail: user?.primaryEmailAddress?.emailAddress,
    //   userUsername: user?.username,
    //   userImageUrl: user?.imageUrl,
    // });
    
    // Set loading to false once we have user data or after a reasonable timeout
    if (user !== undefined) {
      setUserLoading(false);
    }
  }, [user]);

  // Add timeout for user loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      // console.log("⏰ Setup: User loading timeout reached");
      setUserLoading(false);
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, []);

  // Fetch user data to pre-populate fields
  const fetchUserData = async () => {
    try {
      if (user?.id) {
        // console.log("🔍 Setup: Fetching user data for ID:", user.id);
        const result = await fetchAPI(`/user/${user.id}`);
        if (result && result.data && result.data.name) {
          setName(result.data.name);
        }
      } else {
        // console.log("🔍 Setup: No user ID available for fetching user data");
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If user doesn't exist (404), we'll create them in handleContinue
    }
  };

  // Filter suggestions based on input text
  const handleInterestChange = (text: string) => {
    setNewInterest(text);
    // console.log('handleInterestChange called with text:', text);
    // console.log('availableCategories:', availableCategories);
    // console.log('availableKeywords:', availableKeywords);
    // console.log('interests:', interests);

    if (text.trim() === '') {
      setShowSuggestions(false);
      return;
    }

    const allSuggestions = [...availableCategories, ...availableKeywords];
    // console.log('allSuggestions:', allSuggestions);

    const filtered = allSuggestions.filter(item =>
      item.toLowerCase().includes(text.toLowerCase()) &&
      !interests.includes(item)
    );
    // console.log('filtered suggestions:', filtered);

    setFilteredSuggestions(filtered);
    // console.log('showSuggestions set to:', filtered.length > 0);
    setShowSuggestions(filtered.length > 0);
  };

  const fetchAvailableCategoriesAndKeywords = async () => {
    // console.log('fetchAvailableCategoriesAndKeywords called');
    try {
      const response = await fetchAPI('/paper/categories-and-keywords');
      // console.log('API response:', response);
      
      if (response && response.data) {
        // console.log('Setting data from API response');
        setAvailableCategories(response.data.categories || []);
        setAvailableKeywords(response.data.keywords || []);
      } else {
        // console.log('Setting fallback data');
        setAvailableCategories(['Computer Science', 'Physics', 'Mathematics', 'Biology', 'Chemistry']);
        setAvailableKeywords(['machine learning', 'artificial intelligence', 'data science', 'quantum computing']);
      }
    } catch (error) {
      console.error('Error fetching categories and keywords:', error);
      // console.log('Setting fallback data');
      setAvailableCategories(['Computer Science', 'Physics', 'Mathematics', 'Biology', 'Chemistry']);
      setAvailableKeywords(['machine learning', 'artificial intelligence', 'data science', 'quantum computing']);
    } finally {
      // console.log('Setting loadingCategories to false');
      setLoadingCategories(false);
    }
  };

  // Add / remove interests
  const addInterest = () => {
    const trimmed = newInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed]);
      setNewInterest("");
      setShowSuggestions(false);
    }
  };

  const removeInterest = (i: string) => {
    setInterests((prev) => prev.filter((x) => x !== i));
  };

  const selectSuggestion = (suggestion: string) => {
    if (!interests.includes(suggestion)) {
      setInterests((prev) => [...prev, suggestion]);
    }
    setNewInterest("");
    setShowSuggestions(false);
  };

  // Pick an image from the library and upload to Cloudinary
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
        showErrorNotification(result.error || "Failed to pick image", "Upload Failed");
        return;
      }
      
      if (!result.data?.base64) {
        showErrorNotification("Failed to get image data", "Upload Failed");
        return;
      }
  
      // Upload to Clerk
      await user?.setProfileImage({ file: `data:image/jpeg;base64,${result.data.base64}` });
      await user?.reload();                         // refresh cached data
  
      // Save new URL locally if you still store it
      setProfileImageUrl(user?.imageUrl ?? "");
    } catch (err) {
      console.error("Image upload error:", err);
      showErrorNotification("Could not upload image. Please try again.", "Upload Failed");
    } finally {
      setUploading(false);
    }
  };

  // When "Continue" is pressed, PATCH profile data (including profileImageUrl)
  const handleContinue = async () => {
    // console.log("🚀 handleContinue called");
    
    if (isSubmitting) {
      // console.log("❌ Already submitting, ignoring click");
      return;
    }
    
    if (!user?.id) {
      // console.log("❌ No user ID available");
      // console.log("🔍 Current user object:", user);
      showErrorNotification("User session not available. Please try signing in again.", "Session Error");
      return;
    }

    // Validate required fields
    if (!name.trim()) {
      // console.log("❌ Name is empty");
      showErrorNotification("Please enter your name", "Missing Information");
      return;
    }

    setIsSubmitting(true);

    const requestBody = {
      name: name.trim(),
      interests,
      role,
      profile_image_url: user.imageUrl,   // new value from Clerk
    };

    // console.log("Setup: Sending request to update user:", {
    //   userId: user.id,
    //   requestBody
    // });

    try {
      // First try to update the user
      const response = await fetchAPI(`/user/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      // console.log("✅ Setup: User update successful:", response);
      
      // Clear user cache to ensure fresh data is loaded on home screen
      clearCacheByPattern(`/user/${user.id}`);
      // console.log("🗑️ Cleared user cache for fresh data");
      
      // console.log("🔄 Setting redirect flag...");
      setShouldRedirect(true);
    } catch (err: any) {
      console.error("Setup: Failed to update user:", err);
      
      // If user doesn't exist (404), create them
      if (err?.status === 404) {
        // console.log("User not found, creating new user...");
        try {
          // Generate username from email or use existing username
          const username = user.username || 
                          user.primaryEmailAddress?.emailAddress?.split('@')[0] || 
                          `user_${Date.now()}`;
          
          // Use the name provided by user
          const userName = name.trim();

          const createUserBody = {
            clerk_id: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            username: username,
            name: userName,
            interests,
            role,
            profile_image_url: user.imageUrl,
          };

          // console.log("Setup: Creating new user with data:", createUserBody);

          const createResponse = await fetchAPI("/user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(createUserBody),
          });

          // console.log("✅ Setup: User creation successful:", createResponse?.data || createResponse);
          
          // Clear user cache to ensure fresh data is loaded on home screen
          clearCacheByPattern(`/user/${user.id}`);
          // console.log("🗑️ Cleared user cache for fresh data");
          
          // console.log("🔄 Setting redirect flag after user creation...");
          setShouldRedirect(true);
        } catch (createErr: any) {
          console.error("Setup: Failed to create user:", createErr);
          
          // If it's a duplicate key error, try to update the existing user
          if (createErr?.status === 409) {
            // console.log("User already exists, trying to update...");
            try {
              const updateResponse = await fetchAPI(`/user/${user.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
              });
              
              // console.log("✅ Setup: User update successful after creation conflict:", updateResponse);
              
              // Clear user cache to ensure fresh data is loaded on home screen
              clearCacheByPattern(`/user/${user.id}`);
              // console.log("🗑️ Cleared user cache for fresh data");
              
              // console.log("🔄 Setting redirect flag after conflict resolution...");
              setShouldRedirect(true);
            } catch (updateErr) {
              console.error("Setup: Failed to update user after creation conflict:", updateErr);
              showErrorNotification("Could not save profile. Please try again.", "Profile Update Error");
            }
          } else {
            showErrorNotification("Could not create user account. Please try again.", "User Creation Error");
          }
        }
      } else {
        showErrorNotification("Could not save profile. Please try again.", "Profile Update Error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to home if setup is complete
  if (shouldRedirect) {
    return <Redirect href="/(root)/(tabs)/home" />;
  }

  // Show loading screen while user is loading
  if (userLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-lg text-gray-600 mt-4 font-JakartaMedium">Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-8 pb-6">
          <Text className="text-2xl font-JakartaBold text-gray-900 mb-2">Setup Your Profile</Text>
          <Text className="text-gray-600 font-JakartaMedium">Let's personalize your experience</Text>
        </View>

        <View className="px-6 space-y-6">
          {/* Name Section */}
          <View className="bg-white rounded-xl p-6 shadow-sm">
            <Text className="text-lg font-JakartaBold text-gray-900 mb-4">Basic Information</Text>
            
            <View className="mb-4">
              <Text className="text-sm font-JakartaMedium text-gray-700 mb-2">Full Name *</Text>
              <TextInput
                className="border border-gray-200 rounded-lg p-3 text-gray-900 font-JakartaMedium bg-gray-50"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Role */}
            <View>
              <Text className="text-sm font-JakartaMedium text-gray-700 mb-2">Role</Text>
              <View className="border border-gray-200 rounded-lg bg-gray-50">
                <Picker
                  selectedValue={role}
                  onValueChange={(value) => setRole(value)}
                  style={{ color: '#111827' }}
                >
                  <Picker.Item label="Student" value="Student" />
                  <Picker.Item label="Researcher" value="Researcher" />
                  <Picker.Item label="Professor" value="Professor" />
                  <Picker.Item label="Industry" value="Industry" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
            </View>
          </View>

          {/* Profile Image Section */}
          <View className="bg-white rounded-xl p-6 shadow-sm">
            <Text className="text-lg font-JakartaBold text-gray-900 mb-4">Profile Photo</Text>
            
            <View className="items-center">
              {profileImageUrl ? (
                <Image
                  source={{ uri: profileImageUrl }}
                  className="w-20 h-20 rounded-full mb-4"
                />
              ) : (
                <View className="w-20 h-20 rounded-full bg-gray-100 mb-4 items-center justify-center">
                  <Text className="text-2xl text-gray-400 font-JakartaMedium">
                    {name?.[0] || "?"}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                onPress={pickImageAndUpload}
                className="bg-blue-50 rounded-lg px-4 py-2 border border-blue-200"
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Text className="text-blue-600 font-JakartaMedium text-sm">Choose Photo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Interests Section */}
          <View className="bg-white rounded-xl p-6 shadow-sm">
            <Text className="text-lg font-JakartaBold text-gray-900 mb-4">Research Interests</Text>
            <Text className="text-sm text-gray-600 mb-4 font-JakartaMedium">
              Select from popular categories and keywords, or add your own
            </Text>
            
            <View className="flex-row mb-3">
              <TextInput
                className="flex-1 border border-gray-200 rounded-lg p-3 mr-2 bg-gray-50 text-gray-900 font-JakartaMedium"
                value={newInterest}
                onChangeText={handleInterestChange}
                placeholder="Search or add interests..."
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                onPress={addInterest}
                className="bg-blue-500 px-4 rounded-lg justify-center"
              >
                <Text className="text-white font-JakartaMedium text-sm">Add</Text>
              </TouchableOpacity>
            </View>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <View className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 max-h-40">
                <ScrollView className="max-h-40" showsVerticalScrollIndicator={false}>
                  {filteredSuggestions.map((suggestion, idx) => (
                    <TouchableOpacity
                      key={`suggestion-${idx}`}
                      onPress={() => selectSuggestion(suggestion)}
                      className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <Text className="text-gray-800 font-JakartaMedium">{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Popular Categories */}
            {!loadingCategories && availableCategories.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-JakartaMedium text-gray-700 mb-3">Popular Categories</Text>
                <View className="flex-row flex-wrap">
                  {availableCategories.slice(0, 6).map((category, idx) => (
                    <TouchableOpacity
                      key={`cat-${idx}`}
                      onPress={() => {
                        if (!interests.includes(category)) {
                          setInterests((prev) => [...prev, category]);
                        }
                      }}
                      className={`rounded-full px-3 py-1.5 m-1 ${
                        interests.includes(category) ? 'bg-blue-100 border border-blue-200' : 'bg-gray-100'
                      }`}
                    >
                      <Text className={`text-sm font-JakartaMedium ${
                        interests.includes(category) ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {getCategoryDisplayName(category)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Popular Keywords */}
            {!loadingCategories && availableKeywords.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-JakartaMedium text-gray-700 mb-3">Popular Keywords</Text>
                <View className="flex-row flex-wrap">
                  {availableKeywords.slice(0, 6).map((keyword, idx) => (
                    <TouchableOpacity
                      key={`kw-${idx}`}
                      onPress={() => {
                        if (!interests.includes(keyword)) {
                          setInterests((prev) => [...prev, keyword]);
                        }
                      }}
                      className={`rounded-full px-3 py-1.5 m-1 ${
                        interests.includes(keyword) ? 'bg-blue-100 border border-blue-200' : 'bg-gray-100'
                      }`}
                    >
                      <Text className={`text-sm font-JakartaMedium ${
                        interests.includes(keyword) ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {keyword}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Selected Interests */}
            {interests.length > 0 && (
              <View>
                <Text className="text-sm font-JakartaMedium text-gray-700 mb-3">Your Interests</Text>
                <View className="flex-row flex-wrap">
                  {interests.map((int, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => removeInterest(int)}
                      className="bg-blue-100 rounded-full px-3 py-1.5 m-1 border border-blue-200"
                    >
                      <Text className="text-blue-700 text-sm font-JakartaMedium">
                        {getCategoryDisplayName(int)} ×
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Continue Button */}
          <View className="mb-8">
            <TouchableOpacity
              onPress={handleContinue}
              disabled={isSubmitting}
              className="bg-blue-500 rounded-lg py-4"
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-JakartaMedium text-lg">Complete Setup</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Setup;