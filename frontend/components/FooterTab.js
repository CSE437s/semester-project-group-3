import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import {
  MaterialIcons,
  Ionicons,
  MaterialCommunityIcons,
  AntDesign,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const FooterTab = ({ focused }) => {
  const navigation = useNavigation();
  const route = useRoute();

  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          navigation.navigate("FriendFeed");
        }}
      >
        <Ionicons
          name="people-sharp"
          size={24}
          color={focused === "FriendFeed" ? "#6A5ACD" : "grey"}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => {
          navigation.navigate("FitnessPlans");
        }}
      >
        <MaterialCommunityIcons
          name="weight-lifter"
          size={24}
          color={focused === "FitnessPlans" ? "#6A5ACD" : "grey"}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          navigation.navigate("search");
        }}
      >
        <MaterialIcons
          name="search"
          size={24}
          color={focused === "search" ? "#6A5ACD" : "grey"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          navigation.navigate("Calendar");
        }}
      >
        <AntDesign
          name="calendar"
          size={24}
          color={focused === "Calendar" ? "#6A5ACD" : "grey"}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          navigation.navigate("PersonalProfile");
        }}
      >
        <Ionicons
          name="person-circle-sharp"
          size={24}
          color={focused === "PersonalProfile" ? "#6A5ACD" : "grey"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  tabContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    height: 65,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: "5%",
    paddingBottom: 15,
  },
  tabItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  selectedTabItem: {
    backgroundColor: "#f0f0f0", // customize as needed
  },
  tabText: {
    fontSize: 14,
    color: "#333", // customize as needed
  },
};

export default FooterTab;
