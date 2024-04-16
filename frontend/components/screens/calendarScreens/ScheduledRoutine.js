import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { Text, View, Button, ButtonText } from "@gluestack-ui/themed";
import { BACKEND_URL } from "@env";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

const ScheduledRoutine = ({ routine, fetchScheduledWorkout }) => {
  const [showInfo, setShowInfo] = useState(false);

  const toggleShowInfo = () => {
    setShowInfo(!showInfo);
  };

  const handleToggleSet = async (id, complete) => {
    try {
      if (complete) {
        const response = await axios.post(
          BACKEND_URL + `/workout/scheduled/set/uncomplete`,
          { id: id }
        );
      } else {
        const response = await axios.post(
          BACKEND_URL + `/workout/scheduled/set/complete`,
          { id: id }
        );
      }
      fetchScheduledWorkout();
    } catch (error) {
      console.error(error);
      Alert.alert("Error marking set as complete", "Please try again later");
    }
  };

  return (
    <View>
      <View style={styles.routineContainer}>
        <Text
          style={routine.complete && { textDecorationLine: "line-through" }}
        >
          {routine.exercise.name
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </Text>
        <TouchableOpacity onPress={toggleShowInfo}>
          {showInfo ? (
            <AntDesign name="up" size={20} color="black" />
          ) : (
            <AntDesign name="down" size={20} color="black" />
          )}
        </TouchableOpacity>
      </View>

      {showInfo && (
        <View style={styles.sets}>
          {routine.sets.map((item, index) => {
            return (
              <View key={item.id} style={styles.card}>
                <Text>
                  Set {parseInt(index) + 1}: {item.repetitions} x{" "}
                  {item.weight_lbs}lbs
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    handleToggleSet(item.id, item.completed);
                    item.completed = !item.completed;
                  }}
                >
                  {item.completed ? (
                    <Feather name="check-circle" size={20} color="black" />
                  ) : (
                    <Feather name="circle" size={20} color="black" />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  routineContainer: {
    marginTop: 15,
    backgroundColor: "#ebe7f7",
    padding: 15,
    borderRadius: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
    borderRadius: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 50,
  },
  sets: {
    padding: 5,
    marginTop: 10,
  },
});

export default ScheduledRoutine;
