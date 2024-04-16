import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import axios from "axios";
import { BACKEND_URL } from "@env";

const WorkoutFooterItem = ({ item, index, exercise_id }) => {
  const [exerciseInWorkout, setExerciseInWorkout] = useState(false);
  const [routineId, setRoutineId] = useState(null);

  const handlePress = () => {
    if (exerciseInWorkout) {
      handleRemoveExercise();
    } else {
      handleAddExercise();
    }
    setExerciseInWorkout(!exerciseInWorkout);
  };

  const handleAddExercise = async () => {
    try {
      const response = await axios.post(BACKEND_URL + `/workout/routine/add`, {
        workout_id: item.id,
        exercise_id: exercise_id,
      });
    } catch (error) {
      Alert.alert("Error adding exercise to workout", "Please try again later");
      console.error(error);
    }
  };

  const handleRemoveExercise = async () => {
    try {
      const response = await axios.delete(
        BACKEND_URL + `/workout/routine/delete/${routineId}`
      );
    } catch (error) {
      Alert.alert(
        "Error removing exercise from workout",
        "Please try again later"
      );
      console.error(error);
    }
  };

  useEffect(() => {
    item.routines.forEach((routine) => {
      if (exercise_id === routine.exercise_id) {
        setExerciseInWorkout(true);
        setRoutineId(routine.id);
      }
    });
  }, []);

  return (
    <View key={index} style={styles.card}>
      <Text>{item.name}</Text>
      <TouchableOpacity onPress={handlePress}>
        {exerciseInWorkout ? (
          <AntDesign name="checkcircle" size={20} color="#695acd" />
        ) : (
          <AntDesign name="pluscircleo" size={20} color="black" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f0f0f0",
    padding: 16,
    marginBottom: 12,
    borderRadius: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 50,
    width: "100%",
  },
});

export default WorkoutFooterItem;
