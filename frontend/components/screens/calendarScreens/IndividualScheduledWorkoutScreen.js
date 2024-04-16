import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Alert,
  DeviceEventEmitter,
  TextInput,
  Keyboard,
  Button,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from "react-native";
import { Text, View, set } from "@gluestack-ui/themed";
import { BACKEND_URL } from "@env";
import { AntDesign } from "@expo/vector-icons";

import BackArrowIcon from "../../icons/BackArrowIcon";
import ScheduledRoutine from "./ScheduledRoutine";

const IndividualScheduledWorkoutScreen = ({ route, navigation }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const [workout, setWorkout] = useState({});
  const [routines, setRoutines] = useState([]);

  const scheduled_workout_id = route.params?.scheduled_workout_id;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const fetchScheduledWorkout = async () => {
    try {
      const response = await axios.get(
        BACKEND_URL + `/workout/scheduled/one/${scheduled_workout_id}`
      );

      setData(response.data);
      setWorkout(response.data.workout);
      const sortedRoutines = [...response.data.routines].sort(
        (a, b) => a.id - b.id
      );

      sortedRoutines.forEach((routine) => {
        routine.sets.sort((a, b) => a.id - b.id);
        let complete = true;
        routine.sets.forEach((set) => {
          if (!set.completed) {
            complete = false;
          }
        });
        routine.complete = complete;
      });

      setRoutines(sortedRoutines);
      setLoading(false);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Unknown error fetching scheduled workout",
        "Please try again later"
      );
    }
  };

  useEffect(() => {
    fetchScheduledWorkout();
  }, []);

  return (
    <>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView style={styles.content}>
          <TouchableOpacity
            style={[
              styles.chevron,
              { flexDirection: "row", alignItems: "center" },
            ]}
            onPress={() => {
              navigation.goBack();
            }}
          >
            <BackArrowIcon></BackArrowIcon>
          </TouchableOpacity>
          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <View style={styles.container}>
              <View style={styles.workoutInfo}>
                <View style={styles.topContainerTitleRow}>
                  <Text style={styles.titleText}>{workout.name}</Text>
                </View>
                <Text style={styles.topContainerText}>
                  Author: {data.user.username}
                </Text>
                <Text style={styles.topContainerText}>
                  Difficulty:{" "}
                  {workout.difficulty
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </Text>
                <Text style={styles.topContainerText}>
                  {workout.description}
                </Text>
              </View>
              <View>
                {routines.length === 0 && (
                  <Text style={styles.no_exercises_text}>
                    This workout plan does not have any exercises yet.
                  </Text>
                )}
              </View>

              <View>
                {routines.map((routine) => {
                  return (
                    <ScheduledRoutine
                      routine={routine}
                      key={routine.id}
                      fetchScheduledWorkout={fetchScheduledWorkout}
                    ></ScheduledRoutine>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </>
  );
};

const styles = StyleSheet.create({
  topContainer: {
    backgroundColor: "grey",
    padding: 16,
  },
  topContainerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topContainerTitle: {
    fontWeight: "bold",
    fontSize: 22,
    flex: 1, // Allows text to take up maximum width minus icons
  },
  topContainerText: {
    fontSize: 16,
    textAlign: "left", // left justifies text
    color: "black",
  },
  exerciseHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addIcon: {
    marginTop: 15,
    marginRight: "3%",
  },
  addNewButton: {
    padding: 10,
    backgroundColor: "#695acd",
    borderColor: "#695acd",
    borderWidth: 3,
    marginTop: 20,
    borderRadius: 10,
  },
  addNewText: {
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
  },
  bottomContent: {
    justifyContent: "center",
    display: "flex",
    flexDirection: "column",
    paddingBottom: "3%",
  },
  buttonContainer: {
    flexDirection: "row",
  },
  topButtonContainer: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: "5%",
    paddingTop: "3%",
  },
  container: {
    padding: "3%",
    marginTop: -20,
  },
  recommendationContainer: {
    marginTop: 15,
    backgroundColor: "lightgray",
    padding: 15,
    borderRadius: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chevron: {
    paddingTop: "3%",
    paddingBottom: "2%",
  },
  content: {
    marginTop: 20,
  },
  deleteButton: {
    borderWidth: 2,
    borderColor: "#cd695a",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: "45%",
    alignItems: "center",
  },
  editButton: {
    borderWidth: 2,
    borderColor: "#695acd",
    borderRadius: 10,
    backgroundColor: "#695acd",
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: "45%",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 10,
    minWidth: 150,
    marginLeft: 10,
  },
  inputContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  space: {
    minWidth: 300,
  },
  submit_button: {
    backgroundColor: "#B0E0E6",
    border: "none",
    marginTop: 10,
  },
  cancel_button: {
    backgroundColor: "#FFCCCC",
    border: "none",
    marginTop: 10,
  },
  no_exercises_text: {
    textAlign: "center",
    paddingHorizontal: "3%",
    paddingTop: "3%",
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    paddingBottom: "1%",
    paddingTop: "4%",
    maxWidth: "75%",
    color: "black",
  },
  titleTextNotOwned: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "left",
    paddingTop: "2%",
    color: "black",
  },
  subTitleText: {
    fontSize: 16,
    textAlign: "center",
    paddingBottom: "1%",
  },
  notesText: {
    fontSize: 16,
    textAlign: "center",
  },
  exercisesText: {
    fontSize: 20,
    fontWeight: "bold",
    paddingTop: "6%",
    paddingLeft: "1%",
    textAlign: "center",
    color: "black",
  },
  addExercisesText: {
    fontSize: 16,
    fontWeight: "bold",
    paddingTop: "6%",
    paddingLeft: "1%",
    textAlign: "center",
    marginBottom: "4%",
  },
  workoutInfo: {
    backgroundColor: "lightgrey",
    paddingTop: 15,
    paddingBottom: 15,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  routineContainer: {
    marginTop: 15,
    backgroundColor: "#ebe7f7",
    padding: 15,
    borderRadius: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
export default IndividualScheduledWorkoutScreen;
