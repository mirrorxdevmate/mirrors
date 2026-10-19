import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { removePhoto, uploadPhoto, type Shot } from "@/services/api";
import { colors, radius } from "@/theme";
import { pickFromLibrary, takePhoto } from "@/utils/media";
import { Sheet } from "./overlays";
import { Button, T } from "./ui";

/** 6-slot photo editor: add from camera/library, set main, move, replace, remove. */
export function PhotoGrid({
  photos,
  onChange,
  error,
}: {
  photos: string[];
  onChange: (p: string[]) => void;
  error?: boolean;
}) {
  const [slot, setSlot] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const filled = slot !== null && !!photos[slot];

  const close = () => setSlot(null);
  // Uploads to Supabase Storage first, then stores the public URL.
  const act = async (fn: () => Promise<Shot | null>) => {
    const target = slot;
    close();
    if (target === null) return;
    const shot = await fn();
    if (!shot) return;
    setUploading(target);
    try {
      const url = await uploadPhoto(shot);
      const next = [...photos];
      const old = next[target];
      if (old) next[target] = url;
      else next.push(url);
      onChange(next.slice(0, 6));
      if (old) removePhoto(old).catch(() => {});
    } catch (e) {
      Alert.alert(
        "Upload failed",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setUploading(null);
    }
  };

  return (
    <>
      <View style={st.grid}>
        {[0, 1].map((row) => (
          <View key={row} style={st.row}>
            {[0, 1, 2].map((col) => {
              const i = row * 3 + col;
              const uri = photos[i];
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={
                    uri ? `Photo ${i + 1}, edit` : "Add photo"
                  }
                  disabled={uploading !== null}
                  onPress={() => setSlot(uri ? i : photos.length)}
                  style={({ pressed }) => [
                    st.cell,
                    error && i === 0 && !uri && st.cellError,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {uploading === i ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : uri ? (
                    <>
                      <Image
                        source={uri}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                      {i === 0 ? (
                        <View style={st.main}>
                          <T v="caption" color={colors.white}>
                            Main
                          </T>
                        </View>
                      ) : null}
                    </>
                  ) : (
                    <Feather name="plus" size={12} color={colors.grey500} />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <Sheet
        visible={slot !== null}
        onClose={close}
        title={filled ? "Edit photo" : "Add a photo"}
      >
        <View style={{ gap: 8 }}>
          <Button
            title="Take a photo"
            variant="secondary"
            icon={<Feather name="camera" size={16} />}
            onPress={() => act(() => takePhoto())}
          />
          <Button
            title={filled ? "Replace from library" : "Choose from library"}
            variant="secondary"
            icon={<Feather name="image" size={16} />}
            onPress={() => act(pickFromLibrary)}
          />
          {filled && slot! > 0 ? (
            <Button
              title="Make main photo"
              variant="secondary"
              onPress={() => {
                const next = [...photos];
                const [p] = next.splice(slot!, 1);
                onChange([p, ...next]);
                close();
              }}
            />
          ) : null}
          {filled ? (
            <Button
              title="Remove"
              variant="ghost"
              onPress={() => {
                const old = photos[slot!];
                onChange(photos.filter((_, i) => i !== slot));
                close();
                if (old) removePhoto(old).catch(() => {});
              }}
            />
          ) : null}
        </View>
      </Sheet>
    </>
  );
}

const st = StyleSheet.create({
  grid: { gap: 13, marginTop: 8 },
  row: { flexDirection: "row", gap: 13 },
  cell: {
    flex: 1,
    aspectRatio: 124 / 156,
    borderRadius: radius.sm,
    backgroundColor: colors.base,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cellError: {
    borderWidth: 2,
    borderColor: colors.red,
    backgroundColor: "rgba(245,65,65,0.18)",
  },
  main: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
});
