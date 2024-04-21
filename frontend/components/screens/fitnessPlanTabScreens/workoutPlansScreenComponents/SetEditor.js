import React, { useState, useEffect } from "react";
import { View, TextInput, Button, StyleSheet, Text } from "react-native";
import { BACKEND_URL } from "@env";
import axios from "axios";

const SetEditor = ({ setId, setEditingSet, fetchRoutineInfo, setEditingSetTopLevel }) => {
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSet = async () => {
    try {
      const result = await axios.get(
        BACKEND_URL + `/workout/routine/set/${setId}`
      );
      setReps(result.data.repetitions);
      setWeight(result.data.weight_lbs);
      setLoading(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Unknown error encountered", "Please try again later");
    }
  };

  const handleUpdateSet = async () => {
    try {
      const response = await axios.post(
        BACKEND_URL + `/workout/routine/set/update`,
        {
          set_id: setId,
          repetitions: reps,
          weight_lbs: weight,
        }
      );
      setEditingSetTopLevel(false);
      setEditingSet(false);
      fetchRoutineInfo();
    } catch (error) {
      console.error(error);
      Alert.alert("Error updating set info", "Please try again later");
    }
  };

  useEffect(() => {
    fetchSet();
  }, []);

  if (loading) {
    return <></>;
  }

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <Button
                title="-"
                color="#695acd"
                onPress={() => setReps(Math.max(0, parseInt(reps) - 1))}
              />
              <TextInput
                placeholder="Reps"
                style={styles.input}
                value={reps.toString()}
                onChangeText={setReps}
                keyboardType="numeric"
              />
              <Button
                title="+"
                color="#695acd"
                onPress={() => setReps(parseInt(reps) + 1)}
              />
            </View>
            <Text style={styles.label}>Reps</Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <Button
                title="-"
                color="#695acd"
                onPress={() => setWeight(Math.max(0, parseInt(weight) - 5))}
              />
              <TextInput
                placeholder="Weight"
                style={styles.input}
                value={weight.toString()}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
              <Button
                title="+"
                color="#695acd"
                onPress={() => setWeight(parseInt(weight) + 5)}
              />
            </View>
            <Text style={styles.label}>Weight</Text>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Save" onPress={handleUpdateSet} color="#695acd" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    padding: 10,
  },
  inputContainer: {
    flexDirection: "column",  
    alignItems: "center",   
    paddingVertical: 8,
    marginHorizontal: "2.5%",
    width: "45%",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    textAlign: "center",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    marginHorizontal: 8,
    width: "60%",
  },
  label: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: -10,
  }
});

export default SetEditor;
