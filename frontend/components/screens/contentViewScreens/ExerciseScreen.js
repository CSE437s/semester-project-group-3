import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Button,
  ScrollView,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { BACKEND_URL } from "@env";
import YoutubePlayer from "react-native-youtube-iframe";
import { FontAwesome, AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AddExerciseToWorkoutFooter from "./AddExerciseToWorkoutFooter";

const ExerciseScreen = ({ route, navigation }) => {
  const [exerciseData, setExerciseData] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addingToWorkout, setAddingToWorkout] = useState(false);
  const [workoutId, setWorkoutId] = useState(-1);

  // if we come to this from a workout page, we save the id so that we can navigate back to it

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // const fetchExerciseData = async () => {
  //   try {
  //     const response = await axios.get(
  //       BACKEND_URL + `/exercises/one/${exercise_id}`
  //     );

  //     await setExerciseData(response.data);
  //     const savedResponse = await axios.get(
  //       BACKEND_URL +
  //         `/exercises/saved/${await AsyncStorage.getItem("user_id")}/${
  //           exerciseData.id
  //         }`
  //     );
  //     setSaved(savedResponse.data.saved);
  //     setLoading(false);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const handleSave = async () => {
    try {
      if (!saved) {
        const response = await axios.post(BACKEND_URL + `/exercises/save`, {
          userId: await AsyncStorage.getItem("user_id"),
          exerciseId: exerciseData.id,
        });
      } else {
        const response = await axios.post(BACKEND_URL + `/exercises/unsave`, {
          userId: await AsyncStorage.getItem("user_id"),
          exerciseId: exerciseData.id,
        });
      }
      setSaved(!saved);
    } catch (error) {
      console.error(error);
    }
  };

  const initializeData = async () => {
    const exerciseDataTemp = route.params.exerciseData;
    setExerciseData(exerciseDataTemp);

    try {
      const savedResponse = await axios.get(
        BACKEND_URL +
          `/exercises/saved/${await AsyncStorage.getItem("user_id")}/${
            exerciseDataTemp.id
          }`
      );
      setSaved(savedResponse.data.saved);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    initializeData();
    setWorkoutId(route.params?.workoutId);
  }, []);

  //video player stuff
  const [playing, setPlaying] = useState(false);

  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backArrow}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <FontAwesome name="chevron-left" size={24} color="#666666" />
        </TouchableOpacity>
        <View style={styles.buttonsRight}>
          <TouchableOpacity onPress={handleSave}>
            {saved ? (
              <FontAwesome name="star" size={24} color="gold" />
            ) : (
              <FontAwesome name="star-o" size={24} color="gray" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setAddingToWorkout(true);
            }}
          >
            <AntDesign name="pluscircleo" size={24} color="#666666" />
          </TouchableOpacity>
        </View>
      </View>
      <SafeAreaView>
        <ScrollView contentContainerStyle={styles.container}>
          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <View>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>
                  {exerciseData.name
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </Text>
              </View>
              <YoutubePlayer
                height={195}
                play={false}
                videoId={exerciseData.video_path}
                onChangeState={onStateChange}
              />
              <ScrollView
                contentContainerStyle={styles.horizontalScroll}
                horizontal={true}
              >
                {exerciseData.muscles.map((muscle) => {
                  return (
                    <TouchableOpacity
                      key={muscle.id}
                      style={[styles.bubble, styles.muscleGroup]}
                    >
                      <Text style={styles.muscleGroupText}>
                        {muscle.name
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {exerciseData.tags.map((tag) => {
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[styles.bubble, styles.tag]}
                    >
                      <Text style={styles.tagText}>
                        {tag.name
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text>
                Difficulty:{" "}
                {exerciseData.difficulty.replace(/^\w/, (c) => c.toUpperCase())}
              </Text>
              <Text>
                Type:{" "}
                {exerciseData.type
                  ? exerciseData.type.replace(/^\w/, (c) => c.toUpperCase())
                  : "N/A"}
              </Text>
              <Text>
                Equipment Needed:{" "}
                {exerciseData.equipment && exerciseData.equipment != "body_only"
                  ? exerciseData.equipment.replace(/^\w/, (c) =>
                      c.toUpperCase()
                    )
                  : "None"}
              </Text>
              {exerciseData.description.length > 0 && (
                <View style={styles.instructions}>
                  <TouchableOpacity
                    onPress={toggleExpanded}
                    style={styles.toggleButton}
                  >
                    <Text numberOfLines={expanded ? undefined : 4}>
                      Instructions: {exerciseData.description}
                    </Text>

                    <Text style={styles.toggleButtonText}>
                      {expanded ? "Show Less▲" : "Show More▼"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      {addingToWorkout && (
        <AddExerciseToWorkoutFooter
          setAddingToWorkout={setAddingToWorkout}
          exercise_id={exerciseData.id}
        ></AddExerciseToWorkoutFooter>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  container: {
    paddingHorizontal: "5%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  horizontalScroll: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    flexGrow: 0,
    marginVertical: 15,
  },
  instructions: {
    padding: 5,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: "#ebe7f7",
  },
  muscleGroup: {
    backgroundColor: "#695acd",
  },
  muscleGroupText: {
    color: "white",
  },
  tag: {
    backgroundColor: "#cd695a",
  },
  tagText: {
    color: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  titleContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  toggleButtonText: {
    marginTop: 3,
    marginBottom: 5,
    fontSize: 12,
    color: "#555555",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ebe7f7",
    paddingTop: "13%",
    paddingBottom: "4%",
    paddingHorizontal: "6%",
    marginBottom: "3%",
  },
  buttonsRight: {
    display: "flex",
    flexDirection: "row",
    gap: 16,
  },
});

export default ExerciseScreen;
