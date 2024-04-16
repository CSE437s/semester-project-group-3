//NOW HAS BOTH WORKOUT PLANS AND SAVED EXERCISES

import React, { lazy, useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  DeviceEventEmitter,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getYoutubeMeta } from "react-native-youtube-iframe";

import { Text, View } from "@gluestack-ui/themed";
import { MaterialIcons } from "@expo/vector-icons";
import { BACKEND_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDistanceToNow } from "date-fns";
import FooterTab from "../../FooterTab";

const WorkoutPlansScreen = ({ route, navigation }) => {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [created, setCreated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("workouts"); // 'workouts' or 'favoriteExercises'
  const [savedExercises, setSavedExercises] = useState([]);
  const [thumbnails, setThumbnails] = useState({});

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchWorkoutPlans();
    }, [])
  );

  useEffect(() => {
    setLoading(true);
    if (activeTab === "workouts") {
      fetchWorkoutPlans();
    } else {
      loadSavedExercises();
    }
  }, [activeTab]);

  const fetchWorkoutPlans = async () => {
    const userId = await AsyncStorage.getItem("user_id");
    try {
      const response = await axios.get(BACKEND_URL + `/workout/many/${userId}`);
      if (response.status == 200) {
        setWorkoutPlans(
          response.data.sort((a, b) => {
            //Sort by recent
            const dateA = new Date(a.time_created);
            const dateB = new Date(b.time_created);
            return dateB - dateA;
          })
        );
        setLoading(false);
      }
    } catch (error) {
      if (!error.response) {
        Alert.alert("Server issue", "Please try again later");
      } else {
        setWorkoutPlans([]);
      }
      console.log(error);
    }
  };

  const fetchThumbnails = async (data) => {
    const thumbnailData = {};
    for (const item of data) {
      if (!item.video_path) continue;
      try {
        const meta = await getYoutubeMeta(item.video_path);
        thumbnailData[item.id] = meta.thumbnail_url;
      } catch (error) {
        console.error("Error fetching YouTube meta:", error);
      }
    }
    setThumbnails(thumbnailData);
    setLoading(false);
  };

  const loadSavedExercises = async () => {
    try {
      const response = await axios.get(
        BACKEND_URL +
          `/exercises/saved/${await AsyncStorage.getItem("user_id")}`
      );
      setSavedExercises(response.data);
      fetchThumbnails(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddMoreButtonPress = async () => {
    if (activeTab === "workouts") {
      navigation.navigate("CreateNewWorkoutPlan");
    }
    if (activeTab === "favoriteExercises") {
      navigation.navigate("search");
    }
  };

  const renderWorkoutItem = (item) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.workoutPlan}
        onPress={() =>
          navigation.navigate("IndividualWorkoutScreen", {
            workout_id: item.id,
          })
        }
      >
        <View style={styles.workoutMainContent}>
          <Text style={styles.workoutName}>{item.name}</Text>
        </View>

        <Text style={styles.workoutTime}>
          created{" "}
          {formatDistanceToNow(new Date(item.time_created), {
            addSuffix: true,
          })}
        </Text>
      </TouchableOpacity>
    );
  };

  //Event listener for when new workout is created so that we update the list of workouts
  DeviceEventEmitter.addListener("createWorkoutEvent", () => {
    setCreated(true);
  });

  //Refetch workout plans when new one is created
  useEffect(() => {
    setLoading(true);
    fetchWorkoutPlans();
  }, [created]);

  // render the infinite scroll list unless the user has clicked a workout plan
  // then render individual page for that workout plan until they click back

  return (
    <>
      <SafeAreaView>
        <View style={styles.buttonsAndIconsContainer}>
          <TouchableOpacity
            style={activeTab === "workouts" ? styles.iconSelected : styles.icon}
            onPress={() => setActiveTab("workouts")}
          >
            <MaterialIcons
              name="fitness-center"
              size={30}
              color={activeTab === "workouts" ? "#6A5ACD" : "#aaa"} //
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={
              activeTab === "favoriteExercises"
                ? styles.iconSelected
                : styles.icon
            }
            onPress={() => setActiveTab("favoriteExercises")}
          >
            <MaterialIcons
              name="star-border"
              size={30}
              color={activeTab === "favoriteExercises" ? "#6A5ACD" : "#aaa"}
            />
          </TouchableOpacity>
        </View>
        {activeTab === "workouts" ? (
          <ScrollView>
            <View style={styles.contentContainerHeader}>
              <TouchableOpacity style={{ width: 28 }}></TouchableOpacity>
              <Text style={styles.contentContainerText}>
                Your Workout Plans
              </Text>
              <TouchableOpacity
                style={styles.contentContainerButton}
                onPress={handleAddMoreButtonPress}
              >
                <MaterialIcons name="add-circle" size={28} color="#6A5ACD" />
              </TouchableOpacity>
            </View>
            {loading ? (
              <Text>Loading workouts...</Text>
            ) : workoutPlans.length > 0 ? (
              workoutPlans.map((item) => {
                return renderWorkoutItem(item);
              })
            ) : (
              <View style={styles.container}>
                <Text style={styles.space}>
                  You currently have no workout plans.
                </Text>
                <Text style={styles.space}>
                  Workout plans are lists of exercises (sets) that you can
                  create and track your progress with.
                </Text>
                <Text style={styles.space}>
                  You can also share your workout plans with others, or use
                  workout plans that others have shared with you.
                </Text>
                <Text style={styles.space}>
                  Click the button to create your first one!
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <>
            {loading ? (
              <Text>Loading... </Text>
            ) : (
              <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.contentContainerHeader}>
                  <TouchableOpacity style={{ width: 28 }}></TouchableOpacity>
                  <Text style={styles.contentContainerText}>
                    Favorite Exercises
                  </Text>
                  <TouchableOpacity
                    style={styles.contentContainerButton}
                    onPress={handleAddMoreButtonPress}
                  >
                    <MaterialIcons
                      name="add-circle"
                      size={28}
                      color="#6A5ACD"
                    />
                  </TouchableOpacity>
                </View>
                {savedExercises.length === 0 ? (
                  <Text style={styles.placeholder}>
                    You have not saved any exercises yet. Click the star icon
                    when you search for an exercise to save it.
                  </Text>
                ) : (
                  savedExercises.map((exercise) => (
                    <TouchableOpacity
                      key={exercise.id}
                      style={styles.exerciseContainer}
                      onPress={() => {
                        handlePress(exercise.id);
                      }}
                    >
                      <Image
                        source={
                          thumbnails[exercise.id]
                            ? { uri: thumbnails[exercise.id] }
                            : placeHolderImage
                        }
                        style={styles.exerciseImage}
                      />
                      <Text
                        style={styles.exerciseName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {exercise.name
                          .split(" ")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </>
        )}
      </SafeAreaView>
      <FooterTab focused={"FitnessPlans"}></FooterTab>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: "30%",
    alignItems: "center",
  },
  createNewWorkoutPlanButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#CCCCCC",
    marginTop: 20,
  },
  space: {
    marginTop: 20,
    paddingHorizontal: "10%",
    textAlign: "center",
  },
  flatlist: {
    maxHeight: 550, //Todo - make responsive for diff screen sizes
  },
  text: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  contentContainerHeader: {
    flexDirection: "row",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: "4%",
    width: "100%",
  },
  contentContainerText: {
    fontWeight: "bold",
    fontSize: 20,
  },
  contentContainerButton: {
    marginTop: 3,
  },
  workoutName: {
    fontWeight: "bold",
    marginTop: 8,
    fontSize: 23,
  },
  workoutMainContent: {},
  workoutDetail: {
    fontSize: 14,
  },
  workoutTime: {
    fontSize: 12,
    color: "#666",
    alignSelf: "flex-end",
  },
  workoutPlan: {
    backgroundColor: "#FFF",
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    marginVertical: 8,
    marginLeft: 16,
    marginRight: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  workoutName: {
    fontWeight: "bold",
    marginTop: 8,
    fontSize: 23,
  },
  buttonsAndIconsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    alignSelf: "center", // center icons horitzontally
    marginBottom: 10,
  },
  icon: {
    marginTop: 10,
    width: "25%",
    alignItems: "center",
    paddingBottom: 10,
  },
  iconSelected: {
    marginTop: 10,
    borderBottomColor: "#6A5ACD",
    borderBottomWidth: 1,
    width: "25%",
    alignItems: "center",
    paddingBottom: 10,
  },
  exerciseContainer: {
    marginBottom: 16,
  },
  exerciseImage: {
    width: 300,
    height: 175,
    borderRadius: 10,
  },
  exerciseName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default WorkoutPlansScreen;
