import React, { useState } from "react";

import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

import { GluestackUIProvider, Button, ButtonText } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";

import { NavigationContainer } from "@react-navigation/native";

import FooterNavigator from "./components/FooterNavigator";
import LandingPageScreen from "./components/authentication/LandingPageScreen";

//Session variables
import AsyncStorage from "@react-native-async-storage/async-storage";

import FriendFeedScreen from "./components/screens/FriendFeedScreen";
import PersonalProfileScreen from "./components/screens/PersonalProfileScreen";

import JournalScreen from "./components/screens/personalProfileTabSreens/JournalScreen";
import FollowingScreen from "./components/screens/personalProfileTabSreens/FollowingScreen";
import FollowersScreen from "./components/screens/personalProfileTabSreens/FollowersScreen";
import ExerciseScreen from "./components/screens/contentViewScreens/ExerciseScreen";
import SearchScreen from "./components/screens/universalSearchScreens/SearchScreen";
import DirectMessagesScreen from "./components/screens/DirectMessagesScreen";
import CreateNewWorkoutPlanScreen from "./components/screens/fitnessPlanTabScreens/workoutPlansScreenComponents/CreateNewWorkoutPlanScreen";
import EditWorkoutPlanScreen from "./components/screens/fitnessPlanTabScreens/workoutPlansScreenComponents/EditWorkoutPlanScreen";
import IndividualWorkoutPlanScreen from "./components/screens/fitnessPlanTabScreens/workoutPlansScreenComponents/IndividualWorkoutPlanScreen";
import UserProfileScreen from "./components/screens/contentViewScreens/UserProfileScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator;

const App = () => {
  // TODO this should be a state variable once its implemented
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function handleAuthChange() {
    if (isLoggedIn) {
      AsyncStorage.multiRemove(["user_id", "email", "username"]);
    }
    setIsLoggedIn(!isLoggedIn);
  }

  return (
    <GluestackUIProvider config={config}>
      <NavigationContainer>
        {isLoggedIn ? (
          <FooterNavigator handleAuthChange={handleAuthChange} />
        ) : (
          <LandingPageScreen handleAuthChange={handleAuthChange} />
        )}
      </NavigationContainer>
    </GluestackUIProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default App;
