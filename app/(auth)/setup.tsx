import CustomButton from "@/components/CustomButton";
import { fetchAPI } from "@/lib/fetch";
import { getCategoryDisplayName, getCategoryCode } from "@/lib/categoryMapping";
import { useUser } from "@clerk/clerk-expo";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { router } from "expo-router";
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


const Setup = () => {

  const { user } = useUser();
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

  // Fetch available categories and keywords on component mount
  useEffect(() => {
    // console.log('Setup component mounted, fetching categories and keywords');
    fetchAvailableCategoriesAndKeywords();
  }, []);

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
      const response = await fetchAPI('/categories-and-keywords');
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
    // 1. Ask permission & pick
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,          // easiest: let Expo give you base-64 directly
    });
    if (result.canceled) return;
  
    setUploading(true);
  
    try {
      // 2. Convert to something Clerk accepts
      const base64 =
        result.assets[0].base64 ||
        (await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        }));
  
      // 3. Upload to Clerk
      await user?.setProfileImage({ file: `data:image/jpeg;base64,${base64}` });  // or use Blob instead
      await user?.reload();                         // refresh cached data
  
      // 4. Save new URL locally if you still store it
      setProfileImageUrl(user?.imageUrl ?? "");
    } catch (err) {
      console.error(err);
      showErrorNotification("Could not upload image. Please try again.", "Upload Failed");
    } finally {
      setUploading(false);
    }
  };

  // When "Continue" is pressed, PATCH profile data (including profileImageUrl)
  const handleContinue = async () => {
    if (!user?.id) return;

    try {
      await fetchAPI(`/user/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interests,
          role,
          profile_image_url: user.imageUrl,   // new value from Clerk
        }),
      });
      router.push("/(root)/(tabs)/home");
    } catch (err) {
      console.error("Failed to update user:", err);
      showErrorNotification("Could not save profile. Please try again.", "Profile Update Error");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold mb-6">Setup Your Profile</Text>

        {/* --- Interests Section --- */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2 text-black">Research Interests</Text>
          <Text className="text-sm text-gray-600 mb-3">
            Search and select from available paper categories and keywords, or add your own
          </Text>
          
          <View className="flex-row mb-2">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg p-3 mr-2"
              value={newInterest}
              onChangeText={handleInterestChange}
              placeholder="Search categories and keywords..."
              placeholderTextColor="gray"
            />
            <TouchableOpacity
              onPress={addInterest}
              className="bg-blue-500 px-4 rounded-lg justify-center"
            >
              <Text className="text-white font-semibold">Add</Text>
            </TouchableOpacity>
          </View>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <View className="bg-white border border-gray-200 rounded-lg shadow-sm mb-3 max-h-48">
              <ScrollView className="max-h-48">
                {filteredSuggestions.map((suggestion, idx) => (
                  <TouchableOpacity
                    key={`suggestion-${idx}`}
                    onPress={() => selectSuggestion(suggestion)}
                    className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <Text className="text-gray-800">{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Available Categories */}
          {!loadingCategories && availableCategories.length > 0 && (
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-2">Popular Categories:</Text>
              <View className="flex-row flex-wrap">
                {availableCategories.slice(0, 10).map((category, idx) => (
                  <TouchableOpacity
                    key={`cat-${idx}`}
                    onPress={() => {
                      if (!interests.includes(category)) {
                        setInterests((prev) => [...prev, category]);
                      }
                    }}
                    className={`rounded-full px-3 py-1 m-1 ${
                      interests.includes(category) ? 'bg-blue-200' : 'bg-gray-100'
                    }`}
                  >
                    <Text className={`text-sm ${
                      interests.includes(category) ? 'text-blue-800' : 'text-gray-700'
                    }`}>
                      {getCategoryDisplayName(category)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Available Keywords */}
          {!loadingCategories && availableKeywords.length > 0 && (
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-2">Popular Keywords:</Text>
              <View className="flex-row flex-wrap">
                {availableKeywords.slice(0, 15).map((keyword, idx) => (
                  <TouchableOpacity
                    key={`kw-${idx}`}
                    onPress={() => {
                      if (!interests.includes(keyword)) {
                        setInterests((prev) => [...prev, keyword]);
                      }
                    }}
                    className={`rounded-full px-3 py-1 m-1 ${
                      interests.includes(keyword) ? 'bg-blue-200' : 'bg-gray-100'
                    }`}
                  >
                    <Text className={`text-sm ${
                      interests.includes(keyword) ? 'text-blue-800' : 'text-gray-700'
                    }`}>
                      {keyword}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Selected Interests */}
          <View className="mt-3">
            <Text className="text-sm font-medium text-gray-700 mb-2">Your Selected Interests:</Text>
            <View className="flex-row flex-wrap">
              {interests.map((int, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => removeInterest(int)}
                  className="bg-blue-200 rounded-full px-3 py-1 m-1"
                >
                  <Text className="text-blue-800 text-sm">
                    {getCategoryDisplayName(int)} ×
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* --- Role Section using Picker --- */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2 text-black">Role</Text>
          <View className="border border-gray-300 rounded-lg p-1 text-black">
            <Picker
              selectedValue={role}
              onValueChange={(value) => setRole(value)}
            >
              <Picker.Item label="Student" value="Student" color="black" />
              <Picker.Item label="Researcher" value="Researcher" color="black" />
              <Picker.Item label="Professor" value="Professor" color="black" />
              <Picker.Item label="Industry" value="Industry" color="black" />
              <Picker.Item label="Other" value="Other" color="black" />
            </Picker>
          </View>
        </View>

        {/* --- Profile Image Section --- */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2 text-black">Profile Image</Text>

          {/* Show preview if already uploaded */}
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              className="w-24 h-24 rounded-full mb-3"
            />
          ) : null}

          <TouchableOpacity
            onPress={pickImageAndUpload}
            className="bg-blue-500 rounded-lg px-4 py-3 flex-row items-center justify-center"
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">Pick & Upload Image</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* --- Continue Button --- */}
        <CustomButton
          title="Continue"
          onPress={handleContinue}
          className="mt-6"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Setup;