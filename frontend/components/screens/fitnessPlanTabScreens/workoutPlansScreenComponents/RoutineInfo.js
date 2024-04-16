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

import { useNavigation } from "@react-navigation/native";

import { MaterialIcons } from "@expo/vector-icons";

import SetInfo from "./SetInfo";
import { set } from "date-fns";

const RoutineInfo = ({
  setShowRoutineInfo,
  routineInfoId,
  fetchWorkout,
  isOwnedByCurrentUser,
  workoutId,
  workoutFromFrom,
}) => {
  const [sets, setSets] = useState([]);
  const [editing, setEditing] = useState(false);
  const [exerciseName, setExerciseName] = useState("Exercise Info"); // default val if we can't find name
  const [editingSetTopLevel, setEditingSetTopLevel] = useState(false); // if this is true, we don't want to give option to add a set
  const [exerciseId, setExerciseId] = useState(null);

  console.log("bm - workoutFromFrom in RoutineInfo: ", workoutFromFrom);

  const navigation = useNavigation();

  const fetchRoutineInfo = async () => {
    try {
      const response = await axios.get(
        BACKEND_URL + `/workout/routine/${routineInfoId}`
      );
      const setData = response.data.sets.sort((a, b) => a.id - b.id);
      setSets(setData);
      if (response.data.exercise.name) {
        setExerciseName(response.data.exercise.name);
      }
      setExerciseId(response.data.exercise.id);
    } catch (error) {
      Alert.alert("Error fetching exercise info", "Please try again later");
      console.error(error);
    }
  };

  const handleAddSet = async () => {
    try {
      const response = await axios.post(
        BACKEND_URL + `/workout/routine/addSet`,
        {
          routine_id: routineInfoId,
        }
      );
      fetchRoutineInfo();
    } catch (error) {
      console.error(error);
      Alert.alert("Issue creating new set", "Please try again later");
    }
  };

  const handleRemoveSet = async (id) => {
    try {
      const response = await axios.delete(
        BACKEND_URL + `/workout/routine/deleteSet/${id}`
      );
      fetchRoutineInfo();
    } catch (error) {
      console.error(error);
      Alert.alert("Issue deleting set from exericse", "Please try again later");
    }
  };

  const handleDeleteRoutine = async () => {
    try {
      const response = await axios.delete(
        BACKEND_URL + `/workout/routine/delete/${routineInfoId}`
      );
      fetchWorkout();
      setShowRoutineInfo(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error deleting exercise", "Please try again later");
    }
  };

  const renderSet = (item, index) => {
    return (
      <SetInfo
        item={item}
        index={index}
        handleRemoveSet={handleRemoveSet}
        editing={editing}
        fetchRoutineInfo={fetchRoutineInfo}
        editingSetTopLevel={editingSetTopLevel}
        setEditingSetTopLevel={setEditingSetTopLevel}
      ></SetInfo>
    );
  };

  const handleSeeMoreDetails = async (id) => {
    const response = await axios.get(BACKEND_URL + `/exercises/one/${id}`);
    const exerciseData = response.data;

    navigation.navigate("ExerciseScreen", {
      prevPage: "IndividualWorkoutScreen",
      exerciseFrom: "IndividualWorkoutScreen",
      exercise_id: exerciseId,
      exerciseData: exerciseData,
      workout_id: workoutId,
      workoutFromFrom: workoutFromFrom,
    });
  };

  useEffect(() => {
    fetchRoutineInfo();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* <Text style={styles.title}>Exercise Info</Text> */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            {exerciseName
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </Text>
          {!editing && (
            <TouchableOpacity
              onPress={() => {
                setShowRoutineInfo(false);
              }}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={32} color="#000" />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={sets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => renderSet(item, index)}
        />
        {editing && (
          <>
            {!editingSetTopLevel && (
              <>
                <TouchableOpacity
                  style={styles.addNewButton}
                  onPress={handleAddSet}
                >
                  <Text style={styles.addNewText}>Create New Set</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.transparentButton}
                  onPress={() => {
                    setEditing(false);
                  }}
                >
                  <Text style={styles.transparentButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>
      {!editing && (
        <View style={styles.buttonContainer}>
          {isOwnedByCurrentUser && !editing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setEditing(true);
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Edit</Text>
            </TouchableOpacity>
          )}
          {!editing && (
            <TouchableOpacity
              style={styles.seeDetailsButton}
              onPress={() => handleSeeMoreDetails(exerciseId)}
            >
              <Text style={{ color: "#000000", fontWeight: "bold" }}>
                See Details
              </Text>
            </TouchableOpacity>
          )}
          {isOwnedByCurrentUser && !editing && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteRoutine}
            >
              <Text style={{ color: "#cd695a", fontWeight: "bold" }}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addNewButton: {
    padding: 16,
    backgroundColor: "#6A5ACD",
    marginTop: 10,
    borderRadius: 10,
  },
  addNewText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
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
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    paddingVertical: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f0f0f0",
    padding: 16,
    marginBottom: 8,
    borderRadius: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 50,
  },
  closeButton: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    // paddingHorizontal: "20%",
    paddingHorizontal: "5%",
    marginBottom: "5%",
    backgroundColor: "white",
  },
  seeDetailsButton: {
    borderWidth: 2,
    borderColor: "#000000",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    width: "30%",
  },
  deleteButton: {
    borderWidth: 2,
    borderColor: "#cd695a",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    width: "30%",
  },
  editButton: {
    borderWidth: 2,
    borderColor: "#695acd",
    borderRadius: 10,
    backgroundColor: "#695acd",
    width: "30%",
    paddingVertical: 5,
    alignItems: "center",
  },
  setButtonContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 15,
  },
  transparentButton: {
    padding: 16,
    borderColor: "#000",
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 2,
  },
  transparentButtonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default RoutineInfo;
