import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  Alert,
} from "react-native";
import { Text, View } from "@gluestack-ui/themed";
import BackArrowIcon from "../../icons/BackArrowIcon";
import axios from "axios";
import { BACKEND_URL } from "@env";
import SearchScroller from "./SearchScroller";
import SearchFilterBubble from "./SearchFilterBubble";
import AsyncStorage from "@react-native-async-storage/async-storage";

// import { getYoutubeMeta } from "react-native-youtube-iframe";

import { useNavigation, useRoute } from "@react-navigation/native";
import SmartSearchToggleBubble from "./SmartSearchToggleBubble";
import { Entypo } from "@expo/vector-icons";

const SearchScreen = ({}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const prevPage = route.params?.prevPage;

  const categories = ["exercises", "workouts", "users"];

  const [searchBar, setSearchBar] = useState("");
  const prevSearch = useRef("");
  const [timer, setTimer] = useState(0);
  const [searchData, setSearchData] = useState({
    smartSearch: [],
    exercises: [],
    workouts: [],
    users: [],
  });
  // const [loading, setLoading] = useState("");
  const [smartSearch, setSmartSearch] = useState(true);
  const [focus, setFocus] = useState("");
  const TextInputRef = useRef(null);

  //Drop keyboard on return
  const onKeyPress = ({ nativeEvent }) => {
    if (nativeEvent.key === "Enter") {
      TextInputRef.current.blur();
    }
  };

  //Prevent newline character
  const onChangeText = (newText) => {
    setSearchBar(newText.replace(/\n/g, ""));
  };

  // useEffect(() => {
  //   Alert.alert(
  //     "Try our AI-Powered Smart Search!",
  //     "Type in a general search prompt, e.g. 'Body only ab exercises'"
  //   );
  // }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(timer + 1);
    }, 500);

    return () => clearInterval(interval);
  });

  useEffect(() => {
    setTimeout(async () => {
      if (searchBar.length > 0 && prevSearch.current !== searchBar) {
        prevSearch.current = searchBar;
        try {
          const response = await axios.get(
            BACKEND_URL + `/search/${searchBar}`
          );
          const data = response.data;

          const smartResponse = await axios.get(
            BACKEND_URL + `/search/smartsearch/${searchBar}`
          );
          data["smartSearch"] = smartResponse.data;

          setSearchData(data);
        } catch (error) {
          console.error(error);
        }
      }
    }, 0);
  }, [timer]);

  //Handles items that are pressed and navigated to, category is passed in from this screen to each searchscroller
  const handleItemPress = async (category, id) => {
    switch (category) {
      case "exercises":
      case "smart search":
        try {
          const response = await axios.get(
            BACKEND_URL + `/exercises/one/${id}`
          );
          const exerciseData = response.data;

          navigation.navigate("ExerciseScreen", {
            exerciseData: exerciseData,
            prevPage: prevPage,
            exerciseFrom: "search",
          });
        } catch (error) {
          console.error(error);
        }

        break;

      case "users":
        currentUserId = await AsyncStorage.getItem("user_id");
        // if the user is trying to navigate to their own profile, navigate to the personal profile tab
        if (id == currentUserId) {
          navigation.navigate("PersonalProfile");
        } else {
          // else just go to normal user profile tab
          navigation.navigate("UserProfile", { userId: id });
        }
        break;

      case "workouts":
        navigation.navigate("IndividualWorkoutScreen", {
          workout_id: id,
          prevPage: prevPage,
          workoutFrom: "search",
        });
        break;

      default:
        break;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setSearchBar("");
            setSearchData({
              smartSearch: [],
              exercises: [],
              workouts: [],
              users: [],
            });
            setFocus("");
            prevSearch.current = "";
            navigation.goBack();
          }}
        >
          <BackArrowIcon></BackArrowIcon>
        </TouchableOpacity>
        <View style={{ width: "95%", paddingHorizontal: "5%" }}>
          <View style={styles.textInputContainer}>
            <TextInput
              ref={TextInputRef}
              style={styles.text}
              placeholder="Search for exercises, workouts, users, and more..."
              multiline={true}
              numberOfLines={2}
              textAlignVertical="top"
              placeholderTextColor="#525252"
              value={searchBar}
              onChangeText={onChangeText}
              onKeyPress={onKeyPress}
            ></TextInput>
            <TouchableOpacity
              onPress={() => {
                setSearchBar("");
              }}
            >
              <Entypo name="cross" size={24} color="#828282" />
            </TouchableOpacity>
          </View>
          <View style={styles.hr}></View>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.filterScroll}
        style={{ flexGrow: 0, paddingTop: 12 }}
        horizontal={true}
      >
        {focus.length === 0 ? (
          <>
            <SmartSearchToggleBubble
              smartSearch={smartSearch}
              setSmartSearch={setSmartSearch}
            ></SmartSearchToggleBubble>
            {categories.map((category, idx) => {
              return (
                <SearchFilterBubble
                  key={idx}
                  text={category}
                  setFocus={setFocus}
                ></SearchFilterBubble>
              );
            })}
          </>
        ) : (
          <>
            <SearchFilterBubble
              text={""}
              setFocus={setFocus}
            ></SearchFilterBubble>
            <SmartSearchToggleBubble
              smartSearch={smartSearch}
              setSmartSearch={setSmartSearch}
            ></SmartSearchToggleBubble>
            <SearchFilterBubble
              text={focus}
              setFocus={setFocus}
              pressed={true}
            ></SearchFilterBubble>
          </>
        )}
      </ScrollView>
      {smartSearch ? (
        <SearchScroller
          category={"smart search"}
          data={searchData["smartSearch"]}
          handleItemPress={handleItemPress}
        ></SearchScroller>
      ) : (
        <></>
      )}

      {focus.length === 0 ? (
        categories.map((category, idx) => {
          return (
            <SearchScroller
              key={idx}
              category={category}
              data={searchData[category]}
              handleItemPress={handleItemPress}
            ></SearchScroller>
          );
        })
      ) : (
        <SearchScroller
          category={focus}
          data={searchData[focus]}
          handleItemPress={handleItemPress}
        ></SearchScroller>
      )}

      <View style={styles.bottomContent}>
        <View style={styles.buttonContainer}></View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  bottomContent: {
    width: 0,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
  },
  backButton: {
    marginTop: 10,
    alignItems: "center",
    width: "10%",
  },
  topContent: {
    flexDirection: "row",
    paddingVertical: 10,
    alignItems: "center",
    width: "95%",
    marginTop: "5%",
    justifyContent: "flex-start",
  },
  filterScroll: {
    display: "flex",
    justifyContent: "flex-start",
    // alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    flexGrow: 0,
    marginBottom: 10,
  },
  container: {
    display: "flex",
    justifyContent: "flex-start",
    padding: 10,
    minHeight: "100%",
    backgroundColor: "#000000",
    flexDirection: "column",
    paddingBottom: 100,
  },
  hr: {
    borderBottomColor: "#525252",
    borderBottomWidth: 1,
  },
  text: {
    textAlign: "left",
    fontSize: 19,
    marginTop: 10,
    height: 55,
    width: "90%",
    flexWrap: "wrap",
    color: "#FFFFFF",
  },
  textInputContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export default SearchScreen;
