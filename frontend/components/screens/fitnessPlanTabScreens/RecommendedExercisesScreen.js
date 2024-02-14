import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@gluestack-ui/themed';

const RecommendedExercisesScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text>This is the recommended exercises screen</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text>Go back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
});
  
export default RecommendedExercisesScreen;