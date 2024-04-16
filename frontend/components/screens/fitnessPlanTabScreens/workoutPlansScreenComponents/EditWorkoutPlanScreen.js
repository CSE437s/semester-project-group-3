import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Button,
  Dimensions,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  DeviceEventEmitter,
} from "react-native";
import { BACKEND_URL } from "@env";
import { Text, View } from "@gluestack-ui/themed";
import BackArrowIcon from "../../../icons/BackArrowIcon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelectList } from "react-native-dropdown-select-list";
import { CommonActions, useRoute } from "@react-navigation/native";

const EditWorkoutPlanScreen = ({ navigation }) => {
  const route = useRoute();

  const workout_id = route.params?.workout_id;
  const prevPage = route.params?.prevPage;
  const workoutFrom = route.params?.workoutFrom;
  const workoutFromFrom = route.params?.workoutFromFrom;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState("beginner");
  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState([]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const difficulties = [
    { key: 1, value: "beginner" },
    { key: 2, value: "intermediate" },
    { key: 3, value: "expert" },
  ];

  const fetchWorkout = async () => {
    try {
      const result = await axios.get(
        BACKEND_URL + `/workout/one/${workout_id}`
      );
      const workout = result.data;
      setName(workout.name);
      setDescription(workout.description);
      setSelected(workout.difficulty);
      setLoading(false);
      setRoutines(workout.routines);
    } catch (error) {
      if (error.response) {
        Alert.alert("Could not find this workout");
      } else {
        Alert.alert(
          "Server Issue: Fetching Workout Failed",
          error.response?.data?.error || "Please try again later."
        );
      }
    }
  };

  const handleEditWorkout = async () => {
    try {
      const response = await axios.post(BACKEND_URL + "/workout/edit", {
        workoutId: workout_id,
        name,
        description,
        difficulty: selected,
      });
      if (response.status == 200) {
        DeviceEventEmitter.emit("editWorkoutEvent");
        navigation.navigate("IndividualWorkoutScreen", {
          workout_id: workout_id,
        });
      }
    } catch (error) {
      if (error.response) {
        Alert.alert("Invalid request", "Please try again");
      } else {
        Alert.alert(
          "Server Issue: Workout Edit Failed",
          error.response?.data?.error || "Please try again later."
        );
      }
    }
  };

  // fetch workout on initial load and whenever workout_id changes
  useEffect(() => {
    fetchWorkout();
  }, [workout_id]);

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={styles.container}>
        {/* <TouchableOpacity onPress={() => navigation.goBack()}> */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackArrowIcon></BackArrowIcon>
        </TouchableOpacity>
        {loading ? (
          <Text>Loading content...</Text>
        ) : (
          <ScrollView automaticallyAdjustKeyboardInsets={true}>
            <Text style={styles.titleText}> Edit Workout Plan </Text>

            {/* <Text style={styles.space}>Name: </Text> */}
            {/* <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                maxLength={100}
              ></TextInput> */}

            <Text style={styles.subtitleText}>Workout Title</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Workout Name"
              style={styles.input}
            />

            <Text style={styles.subtitleText}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description / Notes"
              multiline={true}
              style={[styles.input, styles.descriptionInput]}
            />

            <Text style={styles.subtitleText}>Difficulty</Text>
            <SelectList
              setSelected={(val) => setSelected(val)}
              data={difficulties}
              save="value"
              search={false}
              minHeight={100}
              maxHeight={120}
              placeholder={selected}
            ></SelectList>

            {/* <View style={styles.submit_button}>
                <Button
                  title="Edit Workout"
                  onPress={() => {
                    if (name.length > 0) {
                      handleEditWorkout();
                    } else {
                      Alert.alert("Workout name cannot be empty");
                    }
                  }}
                  color="#6A5ACD"
                ></Button>
              </View> */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={() => {
                  if (name.length > 0) {
                    handleEditWorkout();
                  } else {
                    Alert.alert("Workout name cannot be empty");
                  }
                }}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() =>
                  navigation.dispatch(
                    CommonActions.navigate({
                      name: workoutFrom,
                      params: {
                        workoutFrom: workoutFromFrom,
                        prevPage: prevPage,
                        workout_id: workout_id,
                      },
                    })
                  )
                }
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: "10%",
  },
  input: {
    width: "100%",
    maxWidth: "100%",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    backgroundColor: "#f7f7f7",
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 16,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#695acd",
  },
  cancelButton: {
    borderColor: "#cd695a",
    borderWidth: 2,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  cancelButtonText: {
    color: "#cd695a",
    fontWeight: "bold",
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    paddingBottom: "4%",
    paddingTop: "4%",
  },
  subtitleText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "left",
    paddingBottom: "4%",
    paddingTop: "1%",
  },
});

export default EditWorkoutPlanScreen;
