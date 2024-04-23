import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {getYoutubeMeta} from "react-native-youtube-iframe";


const SearchScroller = ({ category, data, handleItemPress }) => {
  const [thumbnails, setThumbnails] = useState({});
  const placeHolderImage = require("../../../assets/Weightlifter.jpeg")

  useEffect(() => {
      // Function to fetch thumbnails for each video
      const fetchThumbnails = async () => {
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
      };

      fetchThumbnails();
    }, [data]);

  for(let key in thumbnails) {
    // console.log("ENTRY: " , key, thumbnails[key])
  }
  // console.log("THUMBDAILS: " + thumbnails)

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer]}>
        <Text style={styles.header}>
          {category
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </Text>
      </View>
      {data.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroller}
        >
          {data.map((item) => (
            <View key={item["id"]} style={styles.imageContainer}>
              <TouchableOpacity
                onPress={() => {
                  handleItemPress(category, item["id"]);
                }}
              >
                <Image
                  source={
                    thumbnails[item.id]
                      ? { uri: thumbnails[item.id] }
                      : placeHolderImage
                  }
                  style={styles.image}
                />

                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={styles.caption}
                >
                  {item.name
                    ? item.name
                        .split(" ")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")
                    : item.username}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noResults}>No results found</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    minHeight: 150,
    marginBottom: 10,
  },
  imageContainer: {
    marginRight: 20,
    width: 140,
  },
  image: {
    width: 140,
    height: 85,
    borderRadius: 10,
  },
  caption: {
    color: "#EEEEEE",
    marginTop: 5,
    textAlign: "center",
  },
  header: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#FFFFFF",
    padding: 3,
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  noResults: {
    color: "#D3D3D3",
  },
  scroller: {
    marginTop: 5,
  },
});

export default SearchScroller;
