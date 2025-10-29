// plugins/withPodfileFix.js
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// --- IMPORTANT: REPLACE THIS WITH THE EXACT LINE YOU NEEDED ---
const LINE_TO_ADD =
  "require_relative '../node_modules/react-native/scripts/react_native_pods'"; // Example line, replace!
// Make sure it's the correct line and includes any necessary indentation.

const withPodfileFix = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      // Get the path to the Podfile
      const podfilePath = path.join(
        modConfig.modRequest.platformProjectRoot,
        "Podfile"
      );

      // Read the existing Podfile content
      let podfileContent = await fs.promises.readFile(podfilePath, "utf-8");

      // Check if the line already exists to avoid adding it multiple times
      if (!podfileContent.includes(LINE_TO_ADD)) {
        // Find a suitable place to insert the line.
        // This example inserts it after the 'platform :ios' line, adjust if needed.
        const insertionPoint = "platform :ios";
        const splitContent = podfileContent.split("\n");
        const insertionIndex = splitContent.findIndex((line) =>
          line.includes(insertionPoint)
        );

        if (insertionIndex > -1) {
          // Insert the line after the found line
          splitContent.splice(insertionIndex + 1, 0, LINE_TO_ADD);
          podfileContent = splitContent.join("\n");

          // Write the modified content back to the Podfile
          await fs.promises.writeFile(podfilePath, podfileContent);
          console.log(`✅ Added required line to Podfile: ${LINE_TO_ADD}`);
        } else {
          console.warn(
            `⚠️ Could not find insertion point "${insertionPoint}" in Podfile. Line not added.`
          );
        }
      } else {
        console.log(`ℹ️ Required line already exists in Podfile.`);
      }

      return modConfig;
    },
  ]);
};

module.exports = withPodfileFix;
