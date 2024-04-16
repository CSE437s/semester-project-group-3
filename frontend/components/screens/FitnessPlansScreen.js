import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Text, View } from "@gluestack-ui/themed";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TopBarMenu from "../TopBarMenu";
// import WorkoutPlansScreen from './fitnessPlanTabScreens/WorkoutPlansScreen';
// import FitnessPlansScreenNavigator from "../FitnessPlanScreenNavigator";

const Stack = createNativeStackNavigator();

const FitnessPlansScreen = ({ route, navigation }) => {
  const handleSwitchPage = (page) => {
    navigation.navigate(page, { prevPage: route.name });
  };

  return (
    <>
      <TopBarMenu onSwitchPage={handleSwitchPage} />
      <FitnessPlansScreenNavigator />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default FitnessPlansScreen;
