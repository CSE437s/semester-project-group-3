import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { Text, View, FlatList, RefreshControl } from "@gluestack-ui/themed";
import TopBarMenu from "../TopBarMenu";

import axios from "axios";
import { BACKEND_URL } from "@env";
import { formatDistanceToNow, set } from "date-fns";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FooterTab from "../FooterTab";

import PostBlock from "../buildingBlocks/PostBlock";
import WorkoutBlock from "../buildingBlocks/WorkoutBlock";

const FriendFeedScreen = ({ navigation }) => {
  const handleSwitchPage = (page) => {
    navigation.navigate(page, { prevPage: "FriendFeed" });
  };

  const [workouts, setWorkouts] = useState([]);
  const [posts, setPosts] = useState([]);

  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // -1 means no post comment blocks are open, otherwise it is the id of the post that has the comment block open
  const [openPostCommentBlock, setOpenPostCommentBlock] = useState(-1);

  // -1 means no workout comment blocks are open, otherwise it is the id of the workout that has the comment block open
  const [openWorkoutCommentBlock, setOpenWorkoutCommentBlock] = useState(-1);

  // fetch workouts in initial load
  // in the future, we can grab other types of data (journal entries, favorited exercises?) and display them
  useEffect(() => {
    const getUserId = async () => {
      setCurrentUserId(await AsyncStorage.getItem("user_id"));
    };
    getUserId();
  }, []);

  // fetch workouts when page is navigated to
  useFocusEffect(
    useCallback(() => {
      console.log("bm - in useFocusEffect useCallback");
      if (currentUserId) {
        console.log("bm - in useFocusEffect currentUserId: ", currentUserId);
        fetchFriendWorkouts();
        fetchFriendPosts();
      }
    }, [])
  );

  // fetch workouts when page is navigated to
  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        fetchFriendWorkouts();
        fetchFriendPosts();
      }
    }, [currentUserId])
  )

  // fetch friend workouts (after user id is fetched)
  useEffect(() => {
    if (currentUserId) {
      fetchFriendWorkouts();
      fetchFriendPosts();
    }
  }, [currentUserId]);

  const fetchFriendWorkouts = async () => {
    try {
      const response = await axios.get(
        BACKEND_URL + `/feed/workouts/${currentUserId}`
      );
      const parsedWorkouts = response.data.map((workout) => {
        return {
          type: "workout",
          id: workout.id,
          username: workout.user.username,
          name: workout.name,
          difficulty: workout.difficulty,
          description: workout.description,
          timeCreated: workout.time_created,
          likes: workout.likes,
          comments: workout.comments,
        };
      });
      setWorkouts(parsedWorkouts);
      setLoading(false)
    } catch (e) {
      console.log("error fetching friend workouts for friendFeed page: ", e);
    }
  };

  const fetchFriendPosts = async () => {
    try {
      // console.log('calling fetchFriendPOsts with currentUserId: ', currentUserId)
      const response = await axios.get(
        BACKEND_URL + `/feed/posts/${currentUserId}`
      );
      const parsedPosts = response.data.map((post) => {
        return {
          type: "post",
          id: post.id,
          title: post.title,
          caption: post.caption,
          timeCreated: post.createdAt,
          username: post.user.username,
          likes: post.likes,
          comments: post.comments,
        };
      });
      setPosts(parsedPosts);
      setLoading(false)
    } catch (e) {
      console.log("error fetching friend posts for friendFeed page: ", e);
    }
  }

  // get posts every second (to allow for real time comment updating)
  // TODO this is a hacky solution, we should move to using websockets if time allows
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (currentUserId) {
        console.log("fetching friend posts & workouts...")
        fetchFriendPosts();
        fetchFriendWorkouts();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentUserId])

  // sort all data (workouts and posts) by time created - newest first
  const sortData = (data) => {
    return data.sort((a, b) => {
      return new Date(b.timeCreated) - new Date(a.timeCreated);
    });
  }

  // function to render cells in flatlist
  const renderItem = ({ item }) => {
    // NOTE: we give each piece of data an item.type
    // if we want to add the ability for this page to show more than just workouts in the future
    // it will be as simple as adding another switch here and adding the new data type to the data we fetch
    switch (item.type) {
      case "workout":
        const handleWorkoutPress = () => {
          navigation.navigate("IndividualWorkoutScreen", {
            workout_id: item.id,
            workoutFrom: "FriendFeed",
          });
        }
        return (
          <WorkoutBlock 
            item={item}
            currentUserId={currentUserId}
            handleWorkoutPress={handleWorkoutPress}
            fromProfilePage={false}
            openCommentBlock={openWorkoutCommentBlock}
            setOpenCommentBlock={setOpenWorkoutCommentBlock}
          />
        );
      case "post": 
        return (
          <PostBlock 
            item={item}
            currentUserId={currentUserId}
            fromProfilePage={false}
            openCommentBlock={openPostCommentBlock}
            setOpenCommentBlock={setOpenPostCommentBlock}
          />
        );
      default:
        return (
          <View>
            <Text>{item.title}</Text>
          </View>
        );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFriendWorkouts();
    await fetchFriendPosts();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!loading && workouts.length === 0 && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <MaterialCommunityIcons
          name="weight-lifter"
          size={48}
          color={"black"}
        />
        <Text style={styles.welcomeText}>Welcome to your Feed!</Text>
        <Text style={styles.subWelcomeText}>
          {" "}
          Workout plans or Posts created by accounts that you follow will be displayed
          here
        </Text>
        <FooterTab focused="FriendFeed"></FooterTab>
      </SafeAreaView>
    );
  }

  return (
    <>
      {/* <TopBarMenu onSwitchPage={handleSwitchPage} /> */}
      <SafeAreaView style={styles.container}>
        <FlatList
          data={sortData([...workouts, ...posts])}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      </SafeAreaView>
      <FooterTab focused="FriendFeed"></FooterTab>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: "17%",
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 15,
  },
  subWelcomeText: {
    fontSize: 16,
    color: "black",
    textAlign: "center",
    paddingHorizontal: 10,
  },
});

export default FriendFeedScreen;
