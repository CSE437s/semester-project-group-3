import React, { useState, useEffect, useCallback } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Text,
  FlatList,
  RefreshControl,
  Image,
  TextInput,
  Button,
  KeyboardAvoidingView,
  Keyboard
} from "react-native";
import {
  View,
  VStack,
  ButtonText,
  set,
  Avatar,
  get,
} from "@gluestack-ui/themed";
import { formatDistanceToNow } from "date-fns";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import WorkoutBlock from "../buildingBlocks/WorkoutBlock";

import PostBlock from "../buildingBlocks/PostBlock";


// import TopBarMenu from "../TopBarMenu";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import { BACKEND_URL } from "@env";
import { useFocusEffect } from "@react-navigation/native";
import FooterTab from "../FooterTab";
import { Entypo } from "@expo/vector-icons";

const PersonalProfileScreen = ({ route, navigation, handleAuthChange }) => {
  const [userData, setUserData] = useState(null); // note: workouts are included in userData

  const [activeTab, setActiveTab] = useState("workouts"); // 'workouts' or 'favoriteExercises' or 'posts'

  const [isLoading, setIsLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [workouts, setWorkouts] = useState([]);
  const [favoriteExercises, setFavoriteExercises] = useState([]);
  const [posts, setPosts] = useState([]);

  // state for letting user create a post
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);

  // use this so that we don't display the footer bar when the keyboard is visible
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // -1 means no post comment blocks are open, otherwise it is the id of the post that has the comment block open
  const [openPostCommentBlock, setOpenPostCommentBlock] = useState(-1);

  // -1 means no workout comment blocks are open, otherwise it is the id of the workout that has the comment block open
  const [openWorkoutCommentBlock, setOpenWorkoutCommentBlock] = useState(-1);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true); // Keyboard is visible
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false); // Keyboard is hidden
      }
    );

    // Cleanup function
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // when userId is not null and has changed, we need to fetch the user's data
  useEffect(() => {
    fetchUserData();
  }, []);

  // fetch the user data each time the page is navigated back to
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      getFavoriteExercises();
      getPosts();
    }, [])
  );

  // calculate number of followers and following when userData is updated
  useEffect(() => {
    if (!userData) return;
    setFollowers(userData.followers.length);
    setFollowing(userData.following.length);

    const parsedWorkouts = userData.workouts.map((workout) => {
      return {
        id: workout.id,
        username: workout.user.username,
        name: workout.name,
        difficulty: workout.difficulty,
        description: workout.description,
        timeCreated: workout.time_created,
        likes: workout.likes,
        comments: workout.comments
      };
    });
    setWorkouts(parsedWorkouts);

    getFavoriteExercises();
  }, [userData]);

  const getFavoriteExercises = async () => {
    try {
      const response = await axios.get(
        BACKEND_URL + `/exercises/saved/${userData.id}`
      );
      const parsedExercises = response.data.map((exercise) => {
        return {
          id: exercise.id,
          name: exercise.name,
          timeCreated: exercise.saved,
        };
      });
      setFavoriteExercises(parsedExercises);
    } catch (e) {
      console.log("error fetching favorite exercises: ", e);
    }
  };

  // get posts every second (to allow for real time comment updating)
  // TODO this is a hacky solution, we should move to using websockets if time allows
  useEffect(() => {
    const intervalId = setInterval(() => {
      // console.log("fetching posts...")
      if (activeTab === "posts") {
        getPosts();
      } else if (activeTab === "workouts") {
        console.log("fetching user data...")
        fetchUserData();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [activeTab])

  const getPosts = async () => {
    try {
      const response = await axios.get(
        BACKEND_URL + `/user/${userData.id}/posts`
      );
      const parsedPosts = response.data.map((post) => {
        return {
          id: post.id,
          title: post.title,
          caption: post.caption,
          timeCreated: post.createdAt,
          username: post.user.username,
          likes: post.likes,
          comments: post.comments
        };
      });
      setPosts(parsedPosts);
    } catch (e) {
      console.log("error fetching posts by user ", e)
    }
  };

  // fetch dat associated with current user and populate the userData state
  const fetchUserData = async () => {
    try {
      // fetch user data
      const response = await axios.get(
        BACKEND_URL + `/user/${await AsyncStorage.getItem("user_id")}`
      );
      await setUserData(response.data);
      setIsLoading(false);
    } catch (e) {
      console.log("error fetching user data: ", e);
    }
  };

  const renderWorkoutItem = ({ item }) => {
    const handleWorkoutPress = () => {
      navigation.navigate("IndividualWorkoutScreen", {
        workout_id: item.id,
        prevPage: "PersonalProfile",
        workoutFrom: "PersonalProfile",
      });
    }

    return (
      <WorkoutBlock 
        item={item}
        currentUserId={userData.id}
        handleWorkoutPress={handleWorkoutPress}
        fromProfilePage={true}
        openCommentBlock={openWorkoutCommentBlock}
        setOpenCommentBlock={setOpenWorkoutCommentBlock}
      />
    );
  };

  const goToExercise = async (id) => {
    const response = await axios.get(BACKEND_URL + `/exercises/one/${id}`);
    navigation.navigate("ExerciseScreen", {
      exerciseData: response.data,
      prevPage: null,
      exerciseFrom: "PersonalProfile",
    });
  };

  // silly guy image lol
  // const image = require("../../assets/Man-Doing-Air-Squats-A-Bodyweight-Exercise-for-Legs.png");

  const renderExerciseItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.workoutPlan}
        onPress={() => {
          goToExercise(item.id);
        }}
      >
        <View style={styles.workoutMainContent}>
          <Text style={styles.workoutName}>
            {item.name
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </Text>
        </View>

        <Text style={styles.workoutTime}>
          favorited{" "}
          {formatDistanceToNow(new Date(item.timeCreated), { addSuffix: true })}
        </Text>
      </TouchableOpacity>
    );
  };

  const deletePost = async (postId) => {
    console.log("deleting post: ", postId)
    try {
      await axios.delete(`${BACKEND_URL}/posts/${postId}`);
      getPosts();
    } catch (e) {
      console.error("error deleting post: ", e);
    }
  }

  const renderPostItem = ({ item }) => {
    return (
      <PostBlock 
        item={item}
        currentUserId={userData.id}
        fromProfilePage={true}
        canDelete={true}
        onDeletePost={(id) => deletePost(item.id)}
        openCommentBlock={openPostCommentBlock}
        setOpenCommentBlock={setOpenPostCommentBlock}
      />
    )
  }

  const handleAddMoreButtonPress = async () => {
    if (activeTab === "workouts") {
      setOpenWorkoutCommentBlock(-1);
      navigation.navigate("CreateNewWorkoutPlan", {
        prevPage: "PersonalProfile",
      });
    }
    if (activeTab === "favoriteExercises") {
      navigation.navigate("search", { prevPage: "PersonalProfile" });
    }
    if (activeTab === "posts") {
      setIsCreatingPost(true);
      setOpenPostCommentBlock(-1);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    await getFavoriteExercises();
    setRefreshing(false);
  };

  const requestPermission = async () => {
    console.log("bm - requesting permission")
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return false;
    }
    console.log("bm - permission granted")
    return true;
  };

  const pickImage = async () => {

    const hasPermission = await requestPermission();
    if (!hasPermission) return;
    
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.cancelled) {
        setImage(result.uri);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const submitPost = async () => {
    const formData = new FormData();
    formData.append('caption', caption);
    if (image) {
      formData.append('image', {
        uri: image,
        type: 'image/jpeg', // TODO how to get correct image type?
        name: 'upload.jpg',
      });
    }
    formData.append('userId', userData.id);

    try {
        await axios.post(`${BACKEND_URL}/posts`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        // Reset state and potentially fetch posts again here
        getPosts();
        setIsCreatingPost(false);
        setCaption('');
        setImage(null);
    } catch (error) {
        console.error(error);
        alert('Failed to create post.');
    }
  };


  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: "center" }]}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.profileContainer}>
          <MaterialIcons
            name="account-circle"
            size={95}
            color="#000"
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{userData.username}</Text>
            <View style={styles.stats}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("followersList", {
                    userId: userData.id,
                    navigatingFrom: "PersonalProfile",
                  })
                }
              >
                <Text style={styles.statText}>{followers} Followers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("followingList", {
                    userId: userData.id,
                    navigatingFrom: "PersonalProfile",
                  })
                }
              >
                <Text style={styles.statText}>{following} Following</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.buttonsAndIconsContainer}>
          <TouchableOpacity style={styles.button} onPress={handleAuthChange}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.icon}
            onPress={() => {
              setIsCreatingPost(false);
              setActiveTab("workouts")
            }}
          >
            <MaterialIcons
              name="fitness-center"
              size={30}
              color={activeTab === "workouts" ? "#6A5ACD" : "#aaa"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.icon}
            onPress={() => {
              getPosts()
              setActiveTab("posts")
            }}
          >
            <Entypo
              name="camera"
              size={30}
              color={activeTab === "posts" ? "#6A5ACD" : "#aaa"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.icon}
            onPress={() => {
              setIsCreatingPost(false);
              setActiveTab("favoriteExercises")
            }}
          >
            <MaterialIcons
              name="star-border"
              size={30}
              color={activeTab === "favoriteExercises" ? "#6A5ACD" : "#aaa"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {isCreatingPost ? (
          <View style={styles.createPostContainer}>
            <View style={styles.createPostTopRow}>
              <TextInput
                style={styles.postInput}
                onChangeText={setCaption}
                value={caption}
                placeholder="What's on your mind?"
              />
              {/* TODO: the image button should call pickImage once we get that working */}
              <TouchableOpacity style={styles.postIconButton} onPress={() => {}}>
                <MaterialCommunityIcons name={'file-image-plus'} size={28} color={'#666666'}/>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postIconButton} onPress={submitPost}>
                <FontAwesome name={'send'} size={28} color={'#695acd'}/>
              </TouchableOpacity>
            </View>

            <View styles={styles.addImageToPostRow}>
              
            </View>
            
            {/* {image && (
              <Image source={{ uri: image }} style={{ width: 100, height: 100 }} />
            )} */}
            
            
          </View>
        ) : (
          <>
            <View style={styles.contentContainerHeader}>
              <Text style={styles.contentContainerText}>
                {activeTab === "workouts" && "Workout Plans"}
                {activeTab === "favoriteExercises" && "Favorite Exercises"}
                {activeTab === "posts" && "Posts"}
              </Text>
              <TouchableOpacity
                style={styles.contentContainerButton}
                onPress={handleAddMoreButtonPress}
              >
                <MaterialIcons name="add-circle" size={32} color="#6A5ACD" />
              </TouchableOpacity>
            </View>

            <View style={styles.contentContainer}>
              {activeTab === "workouts" && workouts.length > 0 && (
                <FlatList
                  data={workouts}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderWorkoutItem}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                />
              )}
              {activeTab === "favoriteExercises" &&
                favoriteExercises.length > 0 && (
                  <FlatList
                    data={favoriteExercises}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderExerciseItem}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                      />
                    }
                  />
                )}
              {activeTab === "posts" && posts.length > 0 &&(
                <FlatList
                  data={posts}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderPostItem}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                    />
                  }
                />
              )}
            </View>
          </>
        )}

        
      </SafeAreaView>

      {/* Footer Tab shouldn't get in the way when making a new post */}
      {!keyboardVisible && (
        <FooterTab focused={"PersonalProfile"}></FooterTab>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: "10%",
    alignItems: "left", // specifies where items are aligned horizontally
    paddingTop: "6%",
    paddingHorizontal: "6%",
    paddingBottom: "5%",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "column",
    marginLeft: "5%",
  },
  contentContainerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: 0,
  },
  contentContainerText: {
    fontWeight: "bold",
    fontSize: 20,
    flex: 1,
  },
  contentContainerButton: {
    marginTop: 3,
  },
  username: {
    fontWeight: "bold",
    fontSize: 18,
  },
  stats: {
    flexDirection: "col",
    marginTop: 5,
  },
  statText: {
    marginRight: 15,
    fontSize: 16,
  },
  avatar: {},
  buttonContainer: {
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  top_text: {
    textAlign: "center",
    paddingHorizontal: "3%",
    paddingBottom: "10%",
  },
  mid_text: {
    textAlign: "center",
    paddingHorizontal: "3%",
    paddingBottom: "3%",
  },
  button: {
    borderColor: "#6A5ACD",
    backgroundColor: "#6A5ACD",
    padding: 10,
    borderRadius: 5,
    width: "50%",
    marginTop: 5,
  },
  buttonText: {
    textAlign: "center",
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  icon: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#D3D3D3",
    width: "100%",
    marginTop: 20,
    marginBottom: 10,
  },
  buttonsAndIconsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    alignSelf: "center", // center icons horitzontally
  },
  contentContainer: {
    marginTop: 5,
    marginBottom: "60%", // contols how close to the footerNavigator that the content (FlatLists) is
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
  exerciseContainer: {
    marginBottom: 16,
  },
  exerciseImage: {
    width: 300,
    height: 175,
    borderRadius: 10,
    marginLeft: "2%", // controls where the image is horizontally (how close to either side of screen)
  },
  exerciseName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  postDetail: {
    fontSize: 14,
  },
  postTime: {
    fontSize: 12,
    color: "#666",
    // alignSelf: "flex-end",
  },
  post: {
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
    // flexDirection: "column",
    // justifyContent: "space-between",
  },
  postCaption: {
    fontSize: 16,
  },
  postBottomContent: {
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postTopContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postLikesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  postLikesCount: {
    marginLeft: 5,
    fontSize: 16,
    color: "black",
  },
  createPostContainer: {
    padding: '3%',
  },
  createPostTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    width: '70%',
    backgroundColor: "#f7f7f7",
  },
  postIconButton: {
    paddingTop: '4%',
    marginHorizontal: 2,
  },
  addImageToPostRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postDeleteIcon: {
    marginTop: 5,
  }
});

export default PersonalProfileScreen;
