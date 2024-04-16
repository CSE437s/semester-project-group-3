import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { BACKEND_URL } from "@env";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WorkoutFooterItem from "./WorkoutFooterItem";

const AddExerciseToWorkoutFooter = ({ setAddingToWorkout, exercise_id }) => {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkouts = async () => {
    const userId = await AsyncStorage.getItem("user_id");
    try {
      const response = await axios.get(BACKEND_URL + `/workout/many/${userId}`);
      if (response.status == 200) {
        setWorkoutPlans(
          response.data.sort((a, b) => {
            //Sort by recent
            const dateA = new Date(a.time_created);
            const dateB = new Date(b.time_created);
            return dateB - dateA;
          })
        );
        setLoading(false);
      }
    } catch (error) {
      if (!error.response) {
        Alert.alert("Server issue", "Please try again later");
      } else {
        setWorkoutPlans([]);
      }
      console.log(error);
    }
  };

  const renderWorkout = (item, index) => {
    return (
      <WorkoutFooterItem
        item={item}
        index={index}
        exercise_id={exercise_id}
      ></WorkoutFooterItem>
    );
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  if (workoutPlans.length == 0) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>
            You haven't created any workout plans.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setAddingToWorkout(false)}
          >
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Workouts:</Text>
        <FlatList
          data={workoutPlans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => renderWorkout(item, index)}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => setAddingToWorkout(false)}
        >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    alignItems: "center",
  },
  workout: {
    height: 200,
    backgroundColor: "red",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    paddingVertical: 8,
    textAlign: "center",
  },
  button: {
    borderWidth: 2,
    borderColor: "#695acd",
    borderRadius: 10,
    backgroundColor: "#695acd",
    paddingVertical: 7,
    width: 70,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default AddExerciseToWorkoutFooter;
