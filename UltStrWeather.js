import React from "react";
import { StyleSheet, Text, View, StatusBar } from "react-native";

export default function ({ weatherObj }) {
  console.log("weatherObj = " + weatherObj.category);
  return (
    <View style={styles.container}>
      <Text>초단기실황 카테고리 : {weatherObj.category}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
