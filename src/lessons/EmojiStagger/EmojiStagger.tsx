import { Platform, StyleSheet, Text, View } from "react-native";

import { useChat } from "@/components/ChatProvider";
import type { MessageType } from "@/lib/mock";
import { colors } from "@/lib/theme";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";

interface Props {
  message: MessageType;
}

const emojis = ["👍", "👎", "😂", "😢", "😡", "😲"];

export function EmojiStaggerLesson({ message }: Props) {
  const { currentPopupId, setCurrentPopupId } = useChat();

  const pressed = useSharedValue(false);

  const longPressGesture = Gesture.LongPress()
    .onBegin(() => {
      pressed.value = true;
    })
    .onStart(() => {
      runOnJS(setCurrentPopupId)(message.id);
    })
    .onFinalize(() => {
      pressed.value = false;
    });

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withTiming(pressed.value ? 0.96 : 1) }],
    };
  });

  return (
    <View>
      <GestureDetector gesture={longPressGesture}>
        <Animated.View
          style={[
            styles.message,
            message.from === "me" ? styles.messageMe : styles.messageThem,
            wrapperStyle,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              message.from === "me"
                ? styles.messageTextMe
                : styles.messageTextThem,
            ]}
          >
            {message.message}
          </Text>
        </Animated.View>
      </GestureDetector>

      {currentPopupId === message.id && (
        <View style={styles.emojiPopupContainer}>
          <Animated.View
            style={[styles.emojiPopupWrapper, styles.shadow]}
            entering={FadeInDown.duration(200)}
            exiting={FadeOutDown.delay(emojis.length * 33)}
          >
            <Animated.View style={styles.emojiPopup} entering={FadeInRight}>
              {emojis.map((emoji, i) => (
                <Animated.Text
                  style={styles.emoji}
                  key={emoji}
                  entering={ZoomIn.springify()
                    .delay(33 * i + 100)
                    .stiffness(200)
                    .damping(10)}
                  exiting={ZoomOut.springify().delay((emojis.length - i) * 33)}
                >
                  {emoji}
                </Animated.Text>
              ))}
            </Animated.View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    maxWidth: "80%",
    marginVertical: 8,
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: "white",
  },
  messageTextThem: {
    color: "black",
  },
  messageMe: {
    alignSelf: "flex-end",
    backgroundColor: colors.accent,
  },
  messageThem: {
    alignSelf: "flex-start",
    backgroundColor: "white",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emojiPopupContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  emojiPopupWrapper: {
    top: -45,
    height: 50,
    backgroundColor: colors.overlay,
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,

    elevation: 10,
  },
  emojiPopup: {
    flexDirection: "row",
    gap: 8,
  },
  emoji: {
    fontSize: 36,
    marginTop: Platform.OS === "ios" ? 2 : -1,
  },
});
