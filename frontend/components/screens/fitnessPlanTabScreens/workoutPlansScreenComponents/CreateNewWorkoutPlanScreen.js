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
} from "react-native";
import { BACKEND_URL } from "@env";
import { Text, View } from "@gluestack-ui/themed";
import { Octicons } from "@expo/vector-icons";
import BackArrowIcon from "../../../icons/BackArrowIcon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelectList } from "react-native-dropdown-select-list";

const CreateNewWorkoutPlanScreen = ({ route, navigation }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState("beginner");

  const prevPage = route.params?.prevPage;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const difficulties = [
    { key: 1, value: "beginner" },
    { key: 2, value: "intermediate" },
    { key: 3, value: "expert" },
  ];

  //callback function when button is pressed, makes call to API and handles response
  const handleCreateWorkout = async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      const response = await axios.post(BACKEND_URL + "/workout/create", {
        userId,
        name,
        difficulty: selected,
        description,
        tags: [], //ToDo - Implement Tags
        // exercises: selectedExercises,
      });
      if (response.status == 201) {
        DeviceEventEmitter.emit("createWorkoutEvent");
        navigation.navigate("PersonalProfile");
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
        Alert.alert("Invalid request made to server", "Please try again");
      } else {
        Alert.alert(
          "Server Issue: Workout Creation Failed",
          error.response?.data?.error || "Please try again later."
        );
      }
      console.log(error);
    }
  };

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
          <Text style={styles.titleText}> Create New Workout Plan </Text>

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
                  handleCreateWorkout();
                } else {
                  Alert.alert("Workout name cannot be empty");
                }
              }}
            >
              <Text style={styles.saveButtonText}>Create</Text>
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

export default CreateNewWorkoutPlanScreen;
