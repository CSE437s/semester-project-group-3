import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { Calendar, CalendarList, Agenda } from "react-native-calendars";
import FooterTab from "../../FooterTab";
import { useFocusEffect } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { BACKEND_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const CalendarScreen = ({ navigation }) => {
  const [selected, setSelected] = useState(new Date());
  const [today, setToday] = useState("");
  const [scheduledWorkouts, setScheduledWorkouts] = useState([]);
  const [marks, setMarks] = useState({});
  const [selectedDateWorkouts, setSelectedDateWorkouts] = useState([]);

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split("-").map(Number);

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthName = months[month - 1];

    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) {
      suffix = "st";
    } else if (day === 2 || day === 22) {
      suffix = "nd";
    } else if (day === 3 || day === 23) {
      suffix = "rd";
    }

    return `${monthName} ${day}${suffix}, ${year}`;
  };

  const onScheduleWorkoutPress = () => {
    const onDate = selected;
    onDate.setUTCHours(12);
    navigation.navigate("ScheduleWorkout", {
      onDate: onDate.toISOString(),
    });
  };

  const fetchScheduledWorkouts = async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      const response = await axios.get(
        BACKEND_URL + `/workout/scheduled/${userId}`
      );

      await setScheduledWorkouts(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error fetching calendar", "Please try again later");
    }
  };

  const handlePressDelete = async (id) => {
    try {
      const response = await axios.delete(
        BACKEND_URL + `/workout/scheduled/${id}`
      );
      fetchScheduledWorkouts();
    } catch (error) {
      console.error(error);
      Alert.alert("Error deleting scheduled workout", "Please try again later");
    }
  };

  useFocusEffect(
    useCallback(() => {
      const initializeData = async () => {
        await fetchScheduledWorkouts();
        const currentDate = new Date();
        const offset = currentDate.getTimezoneOffset();
        const todayDate = new Date(currentDate.getTime() - offset * 60000);
        const todayStr = todayDate.toISOString().split("T")[0];
        setToday(todayStr);
        setSelectedDateWorkouts(
          scheduledWorkouts.filter(
            (item) => item.date.split("T")[0] === todayStr
          )
        );
        setSelected(todayDate);
      };

      initializeData();
    }, [])
  );

  useEffect(() => {
    const marked = {
      [selected.toISOString().split("T")[0]]: {
        dots: [],
        selected: true,
        disableTouchEvent: true,
      },
    };
    if (scheduledWorkouts.length > 0) {
      scheduledWorkouts.forEach((item) => {
        const date = item.date.split("T")[0];
        if (date in marked) {
          marked[date].dots.push({
            color: "#6A5ACD",
            selectedDotColor: "black",
          });
        } else {
          marked[date] = { dots: [] };
          marked[date].dots.push({
            color: "#6A5ACD",
            selectedDotColor: "black",
          });
        }
      });
    }
    setMarks(marked);
  }, [selected, scheduledWorkouts]);

  useEffect(() => {
    const todayStr = selected.toISOString().split("T")[0];
    if (scheduledWorkouts.length > 0) {
      setSelectedDateWorkouts(
        scheduledWorkouts.filter((item) => item.date.split("T")[0] === todayStr)
      );
    }
  }, [selected, scheduledWorkouts]);

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.calendarContainer}>
          <Calendar
            style={styles.calendar}
            theme={styles.calendarTheme}
            onDayPress={(day) => {
              setSelected(new Date(day.timestamp));
            }}
            markingType={"multi-dot"}
            markedDates={marks}
          ></Calendar>
        </View>
      </SafeAreaView>

      {selectedDateWorkouts.length == 0 ? (
        <View style={styles.agendaContainer}>
          <View style={styles.contentContainerHeader}>
            <Text style={styles.agendaHeaderText}>
              No Workouts Scheduled{" "}
              {selected.toISOString().split("T")[0] === today
                ? "Today"
                : formatDate(selected.toISOString().split("T")[0])}
            </Text>
            <View style={styles.addNewButtonWrapper}>
              <TouchableOpacity
                style={styles.addNewButton}
                onPress={onScheduleWorkoutPress}
              >
                <AntDesign name="pluscircle" size={36} color="#6A5ACD" />
              </TouchableOpacity>
            </View>
            
          </View>
        </View>
      ) : (
        <View style={styles.agendaContainer}>
          <View style={styles.contentContainerHeader}>
            <Text style={styles.agendaHeaderText}>
              Workouts Scheduled{" "}
              {selected.toISOString().split("T")[0] === today
                ? "Today"
                : formatDate(selected.toISOString().split("T")[0])}
            </Text>
            <TouchableOpacity
              style={styles.addNewButton}
              onPress={onScheduleWorkoutPress}
            >
              <AntDesign name="pluscircle" size={36} color="#6A5ACD" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.agendaItems}>
            {selected.toISOString().split("T")[0] === today
              ? selectedDateWorkouts.map((item) => {
                  if (item.completion == "complete") {
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.completedWorkoutContainer}
                      >
                        <Text style={styles.finishedWorkoutName}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    )
                  } else {
                    return (
                      <View key={item.id} style={styles.scheduledWorkoutCluster}>
                        <TouchableOpacity
                          style={styles.deleteWorkoutButton}
                          onPress={() => {
                            handlePressDelete(item.id);
                          }}
                        >
                          <AntDesign name="delete" size={16} color="black" style={{marginTop: 3}}/>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.todayScheduledWorkoutContainer}
                          onPress={() =>
                            navigation.navigate("IndividualWorkoutScreen", {
                              workout_id: item.workout_id,
                            })
                          }
                        >
                          <Text style={styles.workoutName}>{item.name}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.startWorkoutButton}
                          onPress={() =>
                            navigation.navigate("IndividualScheduledWorkout", {
                              scheduled_workout_id: item.id,
                            })
                          }
                        >
                          <Text style={styles.startText}>Start</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  
                })
              : selectedDateWorkouts.map((item) => {
                if (item.completion == "complete") {
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.completedWorkoutContainer}
                    >
                      <Text style={styles.finishedWorkoutName}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                } else {
                  if (new Date(selected) < new Date(today)) {
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.missedWorkoutContainer}
                      >
                        <Text style={styles.missedWorkoutName}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  } else {
                    return (
                      <View
                        key={item.id}
                        style={styles.scheduledWorkoutCluster}
                      >
                        <TouchableOpacity
                          style={styles.deleteWorkoutButton}
                          onPress={() => {
                            handlePressDelete(item.id);
                          }}
                        >
                          <AntDesign name="delete" size={16} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.scheduledWorkoutContainer}
                          onPress={() =>
                            navigation.navigate("IndividualWorkoutScreen", {
                              workout_id: item.workout_id,
                            })
                          }
                        >
                          <Text style={styles.workoutName}>{item.name}</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }
                }
              }
            )
          }
          </ScrollView>
        </View>
      )}

      
      <FooterTab focused={"Calendar"}></FooterTab>
    </>
  );
};

const styles = StyleSheet.create({
  calendar: {
    width: "100%",
    marginTop: "3%",
  },
  calendarTheme: {
    backgroundColor: "rgba(0,0,0,0)",
    calendarBackground: "rgba(0,0,0,0)",
    arrowColor: "#6A5ACD",
    todayTextColor: "#000000",
    selectedDayTextColor: "#6A5ACD",
    selectedDayBackgroundColor: "#B6ADEF",
  },
  calendarContainer: { paddingBottom: "3%" },
  container: {
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
  },
  agendaContainer: {
    paddingTop: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    height: "52%",
    width: "100%",
  },
  agendaHeaderText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: "3%",
    marginRight: 5,
    width: '85%',
  },
  addNewButtonWrapper: {
    width: "15%",
  },
  addNewButton: {
    paddingBottom: 15,
    paddingRight: 15,
  },
  contentContainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 0,
  },
  agendaItems: {
    width: "100%",
    paddingHorizontal: "5%",
    paddingVertical: "3%",
    marginBottom: "15%",
  },
  scheduledWorkoutContainer: {
    width: "88%",
    backgroundColor: "#b9aae7",
    paddingTop: 15,
    paddingBottom: 15,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  completedWorkoutContainer: {
    width: "100%",
    backgroundColor: "#dcd4f3",
    paddingTop: 15,
    paddingBottom: 15,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  missedWorkoutContainer: {
    width: "100%",
    backgroundColor: "#dcd4f3",
    paddingTop: 15,
    paddingBottom: 15,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 16,
    textAlign: "center",
    color: "black",
  },
  finishedWorkoutName: {
    fontSize: 16,
    textAlign: "center",
    color: "#5CA24C",
    textDecorationLine: "line-through",
  },
  missedWorkoutName: {
    fontSize: 16,
    textAlign: "center",
    color: "#f44336",
  },
  scheduledWorkoutCluster: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
  },
  todayScheduledWorkoutContainer: {
    backgroundColor: "#b9aae7",
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 12,
    marginBottom: 12,
    width: "68%",
  },
  startWorkoutButton: {
    backgroundColor: "#dcd4f3",
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 12,
    marginBottom: 12,
    width: "20%",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  startText: {
    textAlign: "center",
    fontWeight: "bold",
  },
  deleteWorkoutButton: {
    backgroundColor: "#a699cf",
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 12,
    marginBottom: 12,
    width: "12%",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    alignItems: "center",
  },
});

export default CalendarScreen;
