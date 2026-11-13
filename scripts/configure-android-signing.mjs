import fs from "node:fs";

const gradlePath = process.argv[2] || "android/app/build.gradle";
let source = fs.readFileSync(gradlePath, "utf8");

if (!process.env.NEXORA_UPLOAD_KEYSTORE ||
    !process.env.NEXORA_UPLOAD_STORE_PASSWORD ||
    !process.env.NEXORA_UPLOAD_KEY_ALIAS ||
    !process.env.NEXORA_UPLOAD_KEY_PASSWORD) {
  throw new Error("Missing Android upload-signing environment variables.");
}

if (source.includes("signingConfigs.release")) {
  throw new Error("Release signing already configured; refusing to patch twice.");
}

const signingBlock = source.match(/signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\n\s*\}/);
if (!signingBlock) {
  throw new Error("Could not locate the generated Android debug signing configuration.");
}
const releaseConfig = `
    release {
      storeFile file(System.getenv("NEXORA_UPLOAD_KEYSTORE"))
      storePassword System.getenv("NEXORA_UPLOAD_STORE_PASSWORD")
      keyAlias System.getenv("NEXORA_UPLOAD_KEY_ALIAS")
      keyPassword System.getenv("NEXORA_UPLOAD_KEY_PASSWORD")
    }`;
source = source.replace(signingBlock[0], signingBlock[0] + releaseConfig);

const buildTypesIndex = source.indexOf("buildTypes {");
if (buildTypesIndex < 0) throw new Error("Could not locate Android buildTypes block.");
const releaseStart = source.indexOf("release {", buildTypesIndex);
if (releaseStart < 0) throw new Error("Could not locate release build type.");
const before = source.slice(0, releaseStart);
const releaseSection = source.slice(releaseStart);
const updatedReleaseSection = releaseSection.replace("signingConfig signingConfigs.debug", "signingConfig signingConfigs.release");
if (updatedReleaseSection === releaseSection) throw new Error("Could not locate release build signing assignment.");
source = before + updatedReleaseSection;

fs.writeFileSync(gradlePath, source);
console.log("Configured Android release signing from environment secrets.");
