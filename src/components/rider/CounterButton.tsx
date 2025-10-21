import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React, { FC } from "react";
import CustomText from "../shared/CustomText";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import { Colors } from "@/utils/Constants";

interface CounterButtonProps {
  title: string;
  onPress: () => void;
  initialCount: number;
  onCountdownEnd: () => void;
  disabled?: boolean; // Add disabled prop
}

const CounterButton: FC<CounterButtonProps> = ({
  title,
  onPress,
  initialCount,
  onCountdownEnd,
  disabled = false, // Default to false
}) => {
  return (
    <TouchableOpacity 
      onPress={disabled ? undefined : onPress} 
      disabled={disabled}
      style={[
        styles.container,
        disabled && styles.disabledContainer
      ]}
    >
      <CustomText fontFamily="Medium" fontSize={12} style={styles.text}>
        {disabled ? "🔒 Locked" : title}
      </CustomText>
      {!disabled && (
        <View style={styles.counter}>
          <CountdownCircleTimer
            onComplete={onCountdownEnd}
            isPlaying
            duration={initialCount}
            size={30}
            strokeWidth={3}
            colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
            colorsTime={[30, 10, 5, 0]}
          >
            {({ remainingTime }) => (
              <CustomText fontSize={10} fontFamily="SemiBold">
                {remainingTime}
              </CustomText>
            )}
          </CountdownCircleTimer>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  disabledContainer: {
    backgroundColor: "#cccccc",
    opacity: 0.6,
  },
  counter: {
    backgroundColor: "white",
    borderRadius: 50,
  },
  text: {
    color: "#000",
    marginRight: 10,
  },
});

export default CounterButton;
