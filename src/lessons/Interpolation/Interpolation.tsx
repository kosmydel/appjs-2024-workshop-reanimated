import { AnimatedText } from "@/components/AnimatedText";
import { Container } from "@/components/Container";
import { items } from "@/lib/mock";
import { colors, layout } from "@/lib/theme";
import React from "react";
import { ListRenderItemInfo, StyleSheet, Text } from "react-native";
import Animated, {
  clamp,
  Extrapolation,
  interpolate,
  interpolateColor,
  SensorType,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedSensor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type ItemType = (typeof items)[0];

export function Interpolation() {
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x / (layout.itemSize + layout.spacing);
    },
  });

  return (
    <Container style={styles.container}>
      <Animated.FlatList
        data={items}
        scrollEventThrottle={1000 / 60}
        horizontal
        onScroll={onScroll}
        contentContainerStyle={{
          gap: layout.spacing,
          // We are creating horizontal spacing to align the list in the center
          // We don't subtract the spacing here because gap is not applied to the
          // first item on the left and last item on the right.
          paddingHorizontal: (layout.screenWidth - layout.itemSize) / 2,
        }}
        // We can't use pagingEnabled because the item is smaller than the viewport width
        // in our case itemSize and we add the spacing because we have the gap
        // added between the items in the contentContainerStyle
        snapToInterval={layout.itemSize + layout.spacing}
        // This is to snap faster to the closest item
        decelerationRate={"fast"}
        renderItem={(props) => <Item scrollX={scrollX} {...props} />}
      />
    </Container>
  );
}

type ItemProps = ListRenderItemInfo<ItemType> & {
  scrollX: SharedValue<number>;
};

export function Item({ item, index, scrollX }: ItemProps) {
  const sensor = useAnimatedSensor(SensorType.ROTATION, {
    interval: 20,
  });

  const rotateX = useDerivedValue(() => {
    const { roll } = sensor.sensor.value;
    const angle = clamp(roll, -Math.PI / 6, Math.PI / 6);
    return withSpring(-angle, { damping: 300 });
  });
  const rotateY = useDerivedValue(() => {
    const { pitch } = sensor.sensor.value;
    // const angle = clamp(pitch, -Math.PI / 6, Math.PI / 6);
    // Compensate the "default" angle that a user might hold the phone at :)
    // 40 degrees to radians
    const angle = clamp(pitch, -Math.PI / 4, Math.PI) - 40 * (Math.PI / 180);
    return withSpring(-angle, { damping: 300 });
  });

  const stylez = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scaleY: interpolate(
            scrollX.value,
            [index - 1, index, index + 1],
            [0.95, 1, 0.95]
          ),
        },
        {
          perspective: layout.itemSize * 4,
        },
        {
          rotateY: `${interpolate(
            scrollX.value,
            [index - 1, index, index + 1],
            [0, rotateX.value, 0],
            Extrapolation.CLAMP
          )}rad`,
        },
        {
          rotateX: `${interpolate(
            scrollX.value,
            [index - 1, index, index + 1],
            [0, rotateY.value, 0],
            Extrapolation.CLAMP
          )}rad`,
        },
      ],
      opacity: interpolate(
        scrollX.value,
        [index - 1, index, index + 1],
        [0.75, 1, 0.75],
        Extrapolation.CLAMP
      ),
      backgroundColor: interpolateColor(
        sensor.sensor.value.pitch,
        [0, 2],
        [colors.purple, colors.blue]
      ),
    };
  });
  return (
    <Animated.View style={[styles.item, stylez]}>
      <Text>{item.label}</Text>
      <AnimatedText text={scrollX} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: {
    width: layout.itemSize,
    height: layout.itemSize * 1.67,
    borderRadius: layout.radius,
    justifyContent: "flex-end",
    padding: layout.spacing,
    // backgroundColor: colors.overlay,
  },
  container: {
    padding: 0,
  },
});
