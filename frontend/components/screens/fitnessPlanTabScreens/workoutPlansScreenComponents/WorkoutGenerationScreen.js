import React, { useState, useEffect } from "react";
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
  ActivityIndicator
} from "react-native";
import { BACKEND_URL } from "@env";
import { Text, View } from "@gluestack-ui/themed";
import { Octicons } from "@expo/vector-icons";
import BackArrowIcon from "../../../icons/BackArrowIcon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelectList } from "react-native-dropdown-select-list";

const WorkoutGenerationScreen = ({ route, navigation }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState("");
  const [generatingWorkout, setGeneratingWorkout] = useState(false);

  const prevPage = route.params?.prevPage;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const workout_categories = [
    { key: 1, value: "Chest Day" },
    { key: 2, value: "Leg Day" }, 
    { key: 3, value: "Full Body" }, 
    { key: 4, value: "Upper/Lower Split" }, 
    { key: 5, value: "Push/Pull Split" }, 
    { key: 6, value: "Cardio/Strength Split" }, 
    { key: 7, value: "Push/Pull/Legs Split" }, 
    { key: 8, value: "High-Intensity Interval Training" }, 
    { key: 9, value: "Other" }, 

  ]

  //callback function when button is pressed, makes call to API and handles response
  const handleGenerateWorkout = async () => {
    try {
      setGeneratingWorkout(true);
      const userId = await AsyncStorage.getItem("user_id");
      const response = await axios.post(BACKEND_URL + "/workout/create", {
        userId,
        name,
        difficulty: "intermediate",
        description,
        tags: [], //ToDo - Implement Tags
        // exercises: selectedExercises,
      });
      if (response.status == 201) {
        DeviceEventEmitter.emit("createWorkoutEvent");
        // navigation.navigate("PersonalProfile");
        // console.log("response: ", response)
        const workout_id = response.data.id;
        // console.log("workout_id: ", workout_id)
        let category_parsed = (' ' + selected).slice(1).replace(" ", "_").replace("/", "_")
        // console.log("created_workout_id: " + workout_id + " workout_category: " + category_parsed)
        let final_string = `/workout/generation/${workout_id}/${category_parsed}` 
        console.log("final_string: " + final_string)
        try {
          const generationResponse = await axios.post(BACKEND_URL + `/workout/generation/${workout_id}/${category_parsed}`)
          if(generationResponse.status === 200) {
              // console.log("Generation success")
          }
          // console.log("gen response: ", generationResponse)
          // console.log("response:", JSON.stringify(generationResponse.data))

          const exercises = JSON.parse(JSON.stringify(generationResponse.data))
          const exercisePromises = exercises.map(async exercise => {
            const response = await axios.get(BACKEND_URL + `/search/smartsearch/${exercise}`);
            // console.log("response.data: " + JSON.parse(JSON.stringify(response.data)))
            console.log("response.data: " + response.data)
            return response.data[0]["id"];
          });
          const exerciseResponses = await Promise.all(exercisePromises);
          const parsed = JSON.parse(JSON.stringify(exercisePromises))
          const numbers = parsed.map(item => item["_j"]);
          console.log("exerciseResponses: ", exercisePromises)
          console.log("parsed: ", parsed)
          console.log("numbers: ", numbers)
          if(numbers.length < 7) {
            console.log("Not enough exercise IDS: " + numbers.length)
          }
          else {
            const addRoutingResponses = [];
            for (const exercise_id of [
              numbers[5], 
              numbers[0], 
              numbers[1], 
              numbers[2], 
              numbers[3], 
              numbers[4], 
              numbers[6], 
            ]) {
              const response = await axios.post(BACKEND_URL + `/workout/routine/add`, {
                workout_id : workout_id, 
                exercise_id : exercise_id,
              });
              addRoutingResponses.push(response.data);
            }
            setGeneratingWorkout(false);
            Alert.alert("Workout generated successfully", "", [
              {
                text: "Ok",
                // onPress: () => navigation.navigate("PersonalProfile"),
                onPress: () => navigation.goBack(),
              },
            ]);
          }
      }
      catch(genError) {
          console.log("Error from generation: ", genError)
      }

        // Alert.alert("Workout created successfully", "", [
        //   {
        //     text: "Ok",
        //     onPress: () => navigation.navigate("PersonalProfile"),
        //   },
        // ]);
      }
    } catch (error) {
      console.log(
        "error occurred in handleCreateWorkout function: ",
        error.response?.data?.error
      );
      if (error.response) {
        console.log("Error in createWorkout: " + error)
        Alert.alert("Invalid request made to server", "Please try again");
      } else {
        Alert.alert(
          "Server Issue: Workout Creation Failed",
          error.response?.data?.error || "Please try again later."
        );
      }
      console.log(error);
    }
    setGeneratingWorkout(false);
  };

  if (generatingWorkout) {
    return (
      <SafeAreaView>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#695acd" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={styles.container}>
        {/* <TouchableOpacity
            // onPress={() => navigation.goBack()}
            onPress={() => {
              navigation.dispatch(
                CommonActions.navigate({
                  name: prevPage,
                  params: { prevPage: prevPage },
                })
              )
            }}
            // style={styles.space}
          >
            <BackArrowIcon></BackArrowIcon>
        </TouchableOpacity> */}
        <ScrollView automaticallyAdjustKeyboardInsets={true}>
          <Text style={styles.titleText}> Generate New Workout Plan </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Title"
            style={styles.input}
          />

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Description / Notes"
            multiline={true}
            style={[styles.input, styles.descriptionInput]}
          />

          <Text style={styles.subtitleText}>Workout Category</Text>
          <SelectList
            setSelected={(val) => setSelected(val)}
            data={workout_categories}
            save="value"
            search={false}
            minHeight={100}
            maxHeight={120}
            placeholder={"Choose a Workout Category!"}
          ></SelectList>

          <View style={styles.space}></View>

          {/* <Text style={styles.space}>Notes: </Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={10}
              minHeight={100}
              maxHeight={100}
            ></TextInput> */}

          {/* <View style={styles.submit_button}>
              <Button
                title="Create Workout"
                onPress={() => {
                  if (name.length > 0) {
                    handleCreateWorkout();
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
                    if (selected.length > 0) {
                        handleGenerateWorkout();
                    }
                    else {
                        Alert.alert("Workout category was unselected")
                    }
                } else {
                  Alert.alert("Workout name cannot be empty");
                }
              }}
            >
              <Text style={styles.saveButtonText}>Generate</Text>
            </TouchableOpacity>
            {/* onPress={() => {
              navigation.dispatch(
                CommonActions.navigate({
                  name: prevPage,
                  params: { prevPage: prevPage },
                })
              )
            }} */}
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
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
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "left",
    paddingBottom: "2%",
  },
});

export default WorkoutGenerationScreen;
