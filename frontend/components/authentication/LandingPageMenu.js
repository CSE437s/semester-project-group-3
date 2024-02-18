import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { VStack, Button, ButtonText, Text} from '@gluestack-ui/themed';

const LandingPageMenu = ({ navigation, handleAuthChange }) => {
  return (
    <SafeAreaView style={styles.container}>
        <VStack space="md" style={styles.buttonContainer}>
            <Text> TIME TO GET BIG !!!</Text>
            <Button
                onPress={() => navigation.navigate('signupScreen')}
            >
                <ButtonText>Sign up</ButtonText>
            </Button>
            <Button
                onPress={() => navigation.navigate('loginScreen')}
            >
                <ButtonText>Log in</ButtonText>
            </Button>
            <Text> Note: The button below is only here so that we can login for now (since actuall loggin in is not implemented) and will be removed once we get auth working</Text>
            <Button
                onPress={handleAuthChange}
            >
                <ButtonText>Log in (debugging purposes)</ButtonText>
            </Button>
        </VStack>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
});
  
export default LandingPageMenu;