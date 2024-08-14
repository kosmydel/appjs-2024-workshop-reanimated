import { Container } from "@/components/Container";
import { tabsList } from "@/lib/mock";
import { hitSlop } from "@/lib/reanimated";
import { colorShades, layout } from "@/lib/theme";
import { memo, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import Animated, {
  measure,
  MeasuredDimensions,
  runOnJS,
  runOnUI,
  scrollTo,
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type TabsProps = {
  name: string;
  isActiveTabIndex: boolean;
  onActive: (measurements: MeasuredDimensions) => void;
};

const Tab = memo(({ name, isActiveTabIndex, onActive }: TabsProps) => {
  const tabRef = useAnimatedRef<View>();

  const sendMeasurements = () => {
    runOnUI(() => {
      const measurements = measure(tabRef);
      runOnJS(onActive)(measurements);
    })();
  };

  useEffect(() => {
    // Send measurements when the active tab changes. This callback is necessary
    // because we need the tab measurements in order to animate the indicator
    // and the position of the scroll
    if (isActiveTabIndex) {
      sendMeasurements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActiveTabIndex]);

  return (
    <View
      style={styles.tab}
      ref={tabRef}
      onLayout={() => {
        // This is needed because we can't send the initial render measurements
        // without hooking into `onLayout`. When the tab first mounts, we are
        // informing its parent and send the measurements.
        if (isActiveTabIndex) {
          sendMeasurements();
        }
      }}
    >
      <TouchableOpacity
        hitSlop={hitSlop}
        style={{ marginHorizontal: layout.spacing }}
        onPress={sendMeasurements}
      >
        <Text>{name}</Text>
      </TouchableOpacity>
    </View>
  );
});

// This component should receive the selected tab measurements as props
function Indicator({
  selectedTabMeasurements,
}: {
  selectedTabMeasurements: SharedValue<MeasuredDimensions | null>;
}) {
  const stylez = useAnimatedStyle(() => {
    if (!selectedTabMeasurements?.value) {
      return {};
    }

    const { x, width } = selectedTabMeasurements.value;

    return {
      left: withTiming(x),
      width: withTiming(width),
    };
  });
  return <Animated.View style={[styles.indicator, stylez]} />;
}
export function DynamicTabsLesson({
  selectedTabIndex = 0,
  onChangeTab,
}: {
  selectedTabIndex?: number;
  // Call this function when the tab changes
  // Don't forget to check if the function exists before calling it
  onChangeTab?: (index: number) => void;
}) {
  const scrollViewRef = useAnimatedRef<ScrollView>();
  const tabMeasurements = useSharedValue<MeasuredDimensions | null>(null);

  const scrollToTab = (index: number) => {
    runOnUI(() => {
      const scrollViewDimensions: MeasuredDimensions = measure(scrollViewRef);

      if (!scrollViewDimensions || !tabMeasurements.value) {
        return;
      }

      scrollTo(
        scrollViewRef,
        tabMeasurements.value.x -
          // this is how to place the item in the middle
          (scrollViewDimensions.width - tabMeasurements.value.width) / 2,
        0,
        true
      );

      // call onChangeTab after `scrollTo` is called.
      if (onChangeTab) {
        runOnJS(onChangeTab)(index);
      }
    })();
  };

  return (
    <Container>
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.scrollViewContainer}
        ref={scrollViewRef}
      >
        {tabsList.map((tab, index) => (
          <Tab
            key={`tab-${tab}-${index}`}
            name={tab}
            isActiveTabIndex={index === selectedTabIndex}
            onActive={(measurements) => {
              tabMeasurements.value = measurements;
              scrollToTab(index);
            }}
          />
        ))}
        <Indicator selectedTabMeasurements={tabMeasurements} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: "absolute",
    backgroundColor: colorShades.purple.base,
    height: 4,
    borderRadius: 2,
    bottom: 0,
    // left: 0,
    // width: 100,
  },
  tab: {
    marginHorizontal: layout.spacing,
  },
  scrollViewContainer: {
    paddingVertical: layout.spacing * 2,
  },
});
