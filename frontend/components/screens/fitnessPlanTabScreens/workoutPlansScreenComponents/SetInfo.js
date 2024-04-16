import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import SetEditor from "./SetEditor";

const SetInfo = ({
  item,
  index,
  handleRemoveSet,
  editing,
  fetchRoutineInfo,
  editingSetTopLevel,
  setEditingSetTopLevel,
}) => {
  const [editingSet, setEditingSet] = useState(false);

  return (
    <>
      <View key={item.id} style={styles.card}>
        <Text>
          Set {parseInt(index) + 1}: {item.repetitions} x {item.weight_lbs}lbs
        </Text>
        {editing &&
          (editingSetTopLevel || (
            <View style={styles.setButtonContainer}>
              <TouchableOpacity
                onPress={() => {
                  setEditingSet(true);
                  setEditingSetTopLevel(true);
                }}
              >
                <FontAwesome name="edit" size={18} color="#695acd" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  handleRemoveSet(item.id);
                }}
              >
                <Ionicons name="remove-circle-outline" size={18} color="red" />
              </TouchableOpacity>
            </View>
          ))}
      </View>
      {editingSet && (
        <SetEditor
          setId={item.id}
          setEditingSet={setEditingSet}
          setEditingSetTopLevel={setEditingSetTopLevel}
          fetchRoutineInfo={fetchRoutineInfo}
        ></SetEditor>
      )}
    </>
  );
};

const styles = StyleSheet.create({
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
    padding: 16,
    alignItems: "center",
    backgroundColor: "#6A5ACD",
    borderRadius: 10,
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
    paddingHorizontal: "20%",
    marginVertical: "5%",
    backgroundColor: "white",
  },
  deleteButton: {
    borderWidth: 2,
    borderColor: "#FF0000",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
  },
  editButton: {
    borderWidth: 2,
    borderColor: "#90EE90",
    borderRadius: 10,
    backgroundColor: "#90EE90",
    paddingHorizontal: 10,
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

export default SetInfo;
