import {
  View,
  Text,
  TextInputProps,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { FC } from "react";
import { RFValue } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";

interface LocationInputProps extends TextInputProps {
  placeholder: string;
  type: "pickup" | "drop";
  value: string;
  onChangeText: (text: string) => void;
  onGetCurrentLocation?: () => void;
  isGettingLocation?: boolean;
}

const LocationInput: FC<LocationInputProps> = ({
  placeholder,
  type,
  value,
  onChangeText,
  onGetCurrentLocation,
  isGettingLocation = false,
  ...props
}) => {
  const dotColor = type === "pickup" ? "green" : "red";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {/* GPS Button - only show for pickup type */}
      {type === "pickup" && onGetCurrentLocation && (
        <TouchableOpacity
          style={[
            styles.gpsButton,
            isGettingLocation && styles.gpsButtonDisabled,
          ]}
          onPress={onGetCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="locate" size={RFValue(16)} color="white" />
          )}
        </TouchableOpacity>
      )}

      <View
        style={[
          styles.container,
          styles.focusedContainer,
          {
            backgroundColor: value == "" ? "#fff" : "#f2f2f2",
            flex: 1,
          },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: value == "" ? "#fff" : "#f2f2f2",
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={"#aaa"}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />
        {value != "" && (
          <TouchableOpacity onPress={() => onChangeText("")}>
            <Ionicons name="close-circle" size={RFValue(16)} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 7,
  },
  focusedContainer: {
    borderColor: "#4CAF50",
    borderWidth: 1.5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    marginRight: 10,
  },
  input: {
    height: 45,
    width: "90%",
    fontSize: 16,
    color: "#000",
  },
  gpsButton: {
    backgroundColor: "#00B14F",
    width: 45,
    height: 45,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  gpsButtonDisabled: {
    opacity: 0.6,
  },
});

export default LocationInput;
