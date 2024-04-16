import React from "react";

import FriendFeedScreen from "./screens/FriendFeedScreen";
import PersonalProfileScreen from "./screens/PersonalProfileScreen";

import FollowingScreen from "./screens/personalProfileTabSreens/FollowingScreen";
import FollowersScreen from "./screens/personalProfileTabSreens/FollowersScreen";
import ExerciseScreen from "./screens/contentViewScreens/ExerciseScreen";
import SearchScreen from "./screens/universalSearchScreens/SearchScreen";
import WorkoutPlansScreen from "./screens/fitnessPlanTabScreens/WorkoutPlansScreen";
import CreateNewWorkoutPlanScreen from "./screens/fitnessPlanTabScreens/workoutPlansScreenComponents/CreateNewWorkoutPlanScreen";
import EditWorkoutPlanScreen from "./screens/fitnessPlanTabScreens/workoutPlansScreenComponents/EditWorkoutPlanScreen";
import IndividualWorkoutPlanScreen from "./screens/fitnessPlanTabScreens/workoutPlansScreenComponents/IndividualWorkoutPlanScreen";
import UserProfileScreen from "./screens/contentViewScreens/UserProfileScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CalendarScreen from "./screens/calendarScreens/CalendarScreen";
import ScheduleWorkoutScreen from "./screens/calendarScreens/ScheduleWorkoutScreen";
import IndividualScheduledWorkoutScreen from "./screens/calendarScreens/IndividualScheduledWorkoutScreen";
const Stack = createNativeStackNavigator();

const FooterNavigator = ({ handleAuthChange }) => {
  return (
    <Stack.Navigator
      initialRouteName="FriendFeed"
      screenOptions={{
        headerShown: false,
        animation: "none",
        // tabBarShowLabel: false,
      }}
    >
      {/* Changed to display workout plans and saved exercises */}
      <Stack.Screen name="FitnessPlans" component={WorkoutPlansScreen} />

      <Stack.Screen name="search" component={SearchScreen} />

      <Stack.Screen name="PersonalProfile" initialParams={{ userId: "" }}>
        {(props) => (
          <PersonalProfileScreen
            {...props}
            handleAuthChange={handleAuthChange}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="FriendFeed" component={FriendFeedScreen} />

      {/* <Stack.Screen name="journal" component={JournalScreen} /> */}
      <Stack.Screen name="followingList" component={FollowingScreen} />
      <Stack.Screen name="followersList" component={FollowersScreen} />
      <Stack.Screen name="ExerciseScreen" component={ExerciseScreen} />
      {/* <Stack.Screen name="dms" component={DirectMessagesScreen} /> */}
      <Stack.Screen
        name="CreateNewWorkoutPlan"
        component={CreateNewWorkoutPlanScreen}
      />
      <Stack.Screen name="EditWorkoutPlan" component={EditWorkoutPlanScreen} />
      <Stack.Screen
        name="IndividualWorkoutScreen"
        component={IndividualWorkoutPlanScreen}
      />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen
        name="ScheduleWorkout"
        component={ScheduleWorkoutScreen}
      ></Stack.Screen>
      <Stack.Screen
        name="IndividualScheduledWorkout"
        component={IndividualScheduledWorkoutScreen}
      />
    </Stack.Navigator>
  );
};
export default FooterNavigator;
