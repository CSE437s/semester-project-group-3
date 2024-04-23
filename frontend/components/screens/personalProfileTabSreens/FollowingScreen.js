import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text, View, set } from '@gluestack-ui/themed';
import { MaterialIcons } from "react-native-vector-icons";

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

import { BACKEND_URL } from "@env";

import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const FollowingScreen = ({route, navigation}) => {
  // userId is the id of the user whose following list we want to display
  const userId = route.params.userId;

  // this is the page that the user is navigating from
  const navigatingFrom = route.params.navigatingFrom;

  const [currentUserId, setCurrentUserId] = useState(null);
  const [followingList, setFollowingList] = useState(null);

  // set the current user id on initial load
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('user_id');
        setCurrentUserId(id);
      }
      catch (e) {
        console.log("error getting current user id: ", e);
      }
    }

    getCurrentUserId();
  }, []);

  const fetchFollowingList = useCallback(async () => {
    const response = await axios.get(BACKEND_URL + `/user/following/${userId}`);

    // only extract the needed information from what is returned
    const followingList = response.data.map((follow) => {
      user = follow.following;
      return {
        id: user.id,
        username: user.username,
      }
    })

    if (response.status == 200) {
      setFollowingList(followingList);
    }
    else {
      console.log("error getting following list: ", response.data);
    }
  }, [userId]);

  const getTitleText = () => {
    // if the userId is the current user, then we want to display "Your Followers"
    // otherwise, we want to display "Followers"
    try {
      if (userId === parseInt(currentUserId)) {
        return "Accounts you Follow";
      }
      else {
        return "Followed Accounts";
      }
    }
    catch (e) {
      return "Followed Accounts";
    }
  }

  const handleBackButtonPress = () => { 
    navigation.dispatch(
      CommonActions.navigate({
        name: navigatingFrom,
        params: { prevPage: "followingList", userId: userId},
      })
    );
  }

  const handleNavToProfile = async (userId) => {
    // need to go to personal profile page if the user is the current user
    if (userId === parseInt(currentUserId)) {
      navigation.navigate('PersonalProfile');
    }
    else {
      navigation.navigate('UserProfile', { userId: userId });
    }
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleNavToProfile(item.id)}>
      <MaterialIcons
          name="account-circle"
          size={48}
          color="#000" 
          style={styles.avatar}
        />
      <Text style={styles.username}>{item.username}</Text>
    </TouchableOpacity>
  );

  useFocusEffect(
    useCallback(() => {
      fetchFollowingList();
    }, [fetchFollowingList])
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getTitleText()}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={followingList}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomContent: {
    display: 'flex',
    alignItems: "flex-end",
    paddingTop: 10,
  },
  align: {
    textAlign: 'center',
    paddingHorizontal: '3%',
    paddingBottom: '10%',
  },
  topText: {
    paddingBottom: '10%',
  },
  buttonContainer: {
    flexDirection: "row",
  },
  backButton: {
    borderWidth: 2,
    borderColor: "#6A5ACD",
    borderRadius: 10,
    backgroundColor: "#6A5ACD",
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
  },
  flatlist: {
    maxHeight: 550,
  },
  container: {
    flex: 1,
    padding: 10,
    paddingTop: '15%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    marginRight: 10,
  },
  username: {
    fontSize: 18,
  },
  buttonText: {
    textAlign: "center",
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
  
export default FollowingScreen;