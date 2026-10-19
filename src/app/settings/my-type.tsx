import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Sheet } from "@/components/overlays";
import { SingleSelect } from "@/components/step";
import { ChevronLeft } from "@/components/icons";
import { Slider } from "@/components/Slider";
import { Badge, Header, Row, Screen } from "@/components/ui";
import { planAtLeast, useApp } from "@/store/useApp";
import { colors, fonts } from "@/theme";

const ADVANCED: Record<string, string[]> = {
  Culture: ["Open", "Similar to mine", "Specific"],
  Nationality: ["Any", "Same as mine", "Specific"],
  Ethnicity: ["Any", "Same as mine", "Specific"],
  Religion: ["Any", "Same as mine", "Practising only"],
  Lifestyle: ["Any", "Active", "Balanced", "Easy-going"],
  "Career / profession": ["Any", "Ambitious", "Stable"],
  Education: ["Any", "Bachelor's or higher", "Master's or higher"],
  "Family goals": ["Any", "Wants children", "Doesn't want children"],
  "Communication style": ["Any", "Frequent", "Independent"],
  "Preference flexibility": ["Strict", "Balanced", "Open"],
  "Preference vs deal-breaker": ["Simple", "Detailed"],
};

function Item({
  label,
  value,
  onPress,
  dim,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  dim?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [st.item, pressed && { opacity: 0.7 }]}
    >
      <Text style={[st.label, dim && { color: colors.grey500 }]}>{label}</Text>
      <Row gap={8}>
        {value ? (
          <Text style={[st.value, dim && { color: colors.grey500 }]}>
            {value}
          </Text>
        ) : null}
        {!dim ? (
          <View style={{ transform: [{ scaleX: -1 }] }}>
            <ChevronLeft color={colors.grey900} />
          </View>
        ) : null}
      </Row>
    </Pressable>
  );
}

export default function MyType() {
  const type = useApp((s) => s.type);
  const plan = useApp((s) => s.plan);
  const intent = useApp((s) => s.profile.intent);
  const updateType = useApp((s) => s.updateType);
  const unlocked = planAtLeast(plan, "plus");
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Screen scroll>
      <Header title="My Type" />
      <View style={{ gap: 12, marginTop: 12 }}>
        <View style={st.box}>
          <Row style={{ justifyContent: "space-between" }}>
            <Text style={st.label}>Age range</Text>
            <Text style={st.label}>
              {type.ageMin}-{type.ageMax}
            </Text>
          </Row>
          <Slider
            label="Age range"
            min={18}
            max={80}
            values={[type.ageMin, type.ageMax]}
            onChange={([ageMin, ageMax]) => updateType({ ageMin, ageMax })}
          />
        </View>
        <View style={st.box}>
          <Row style={{ justifyContent: "space-between" }}>
            <Text style={st.label}>Distance</Text>
            <Text style={st.label}>
              Within {type.distanceKm}{" "}
              <Text style={{ fontSize: 12, color: colors.grey600 }}>km</Text>
            </Text>
          </Row>
          <Slider
            label="Distance"
            min={5}
            max={100}
            values={[type.distanceKm]}
            onChange={([distanceKm]) => updateType({ distanceKm })}
          />
        </View>
        <Item
          label="Relationship goal"
          value={intent.split(" ")[0] || "Set"}
          onPress={() => router.push("/onboarding/intent?edit=1")}
        />
        <Item
          label="Basic type preferences"
          value="Edit"
          onPress={() => router.push("/type/understood?edit=1")}
        />
        <Item
          label="Deal-breakers"
          value="Edit"
          onPress={() => router.push("/type/flexibility?edit=1")}
        />
      </View>

      <Row gap={10} style={{ marginTop: 24, marginBottom: 12 }}>
        <Text style={st.section}>ADVANCED TYPE CONTROLS</Text>
        {!unlocked ? <Badge kind="plus" small /> : null}
      </Row>
      <View style={{ gap: 6 }}>
        {Object.keys(ADVANCED).map((k) => (
          <Item
            key={k}
            label={k}
            dim={!unlocked}
            value={
              unlocked
                ? k === "Preference flexibility" ||
                  k === "Preference vs deal-breaker"
                  ? (type.advanced[k] ?? ADVANCED[k][1])
                  : "Edit"
                : "—"
            }
            onPress={() =>
              unlocked
                ? setOpen(k)
                : router.push({
                    pathname: "/upgrade/plans",
                    params: { plan: "plus" },
                  })
            }
          />
        ))}
      </View>

      <Sheet visible={!!open} onClose={() => setOpen(null)} title={open ?? ""}>
        <ScrollView style={{ maxHeight: 420 }}>
          {open ? (
            <SingleSelect
              options={ADVANCED[open]}
              value={type.advanced[open] ?? ADVANCED[open][0]}
              onChange={(v) => {
                updateType({ advanced: { ...type.advanced, [open]: v } });
                setOpen(null);
              }}
            />
          ) : null}
          <View style={{ height: 8 }} />
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  box: {
    backgroundColor: colors.base,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 12,
  },
  item: {
    minHeight: 55,
    backgroundColor: colors.base,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 20,
    color: colors.grey800,
  },
  value: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 20,
    color: colors.grey800,
  },
  section: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 20,
    color: colors.grey700,
  },
});
