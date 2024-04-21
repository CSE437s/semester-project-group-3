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
import { SelectList } from "react-native-dropdown-select-list";
import { Text, View } from "@gluestack-ui/themed";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ScheduleWorkoutScreen = ({ route, navigation }) => {
  const onDate = route.params?.onDate;

  const [date, setDate] = useState(new Date(onDate));
  const [workouts, setWorkouts] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const onDateChange = (event, selectedDate) => {
    setDate(selectedDate);
  };

  const scheduleWorkout = async () => {
    console.log(date);
    try {
      const response = await axios.post(BACKEND_URL + `/workout/schedule`, {
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        workoutId: selected,
      });

      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error scheduling workout", "Please try again later");
    }
  };

  const fetchWorkouts = async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      const response = await axios.get(BACKEND_URL + `/workout/many/${userId}`);
      setWorkouts(
        response.data.map((item) => ({ key: item.id, value: item.name }))
      );
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  if (loading) {
    return (
      <SafeAreaView>
        <View style={styles.container}>
          <Text style={styles.subtitleText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView>
        <ScrollView
          automaticallyAdjustKeyboardInsets={true}
          contentContainerStyle={styles.container}
        >
          <Text style={styles.titleText}> Schedule a Workout </Text>
          <Text style={styles.subtitleText}>Date:</Text>
          <DateTimePicker
            value={date}
            onChange={onDateChange}
            minimumDate={new Date()}
          ></DateTimePicker>

          <Text style={styles.subtitleText}>Workout:</Text>
          <SelectList
            setSelected={(val) => setSelected(val)}
            data={workouts}
            save="key"
            search={true}
            minHeight={100}
            maxHeight={120}
            placeholder="Select a Workout"
          ></SelectList>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => {
                if (!selected) {
                  Alert.alert("Please select a workout");
                } else {
                  scheduleWorkout();
                }
              }}
            >
              <Text style={styles.saveButtonText}>Create</Text>
            </TouchableOpacity>

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
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
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

export default ScheduleWorkoutScreen;
