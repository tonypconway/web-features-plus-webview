import bcd from "@mdn/browser-compat-data" with { type: "json" };
import overrides from "./overrides.json" with { type: "json" };
import { features as webFeatures } from "web-features";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveBcdKey = (keyString) =>
  keyString.split(".").reduce((acc, key) => acc?.[key], bcd);

const getWebViewSupportVersion = (supportData) => {
  // TODO: Sometimes the support data for a given browser is an array, not a single object.
  // But web-features doesn't take this into account when building. To investigate.
  // if (typeof supportData === Array) {
  //   supportData = supportData[0]
  // }
  return supportData?.partial_implementation === true
    ? false
    : supportData?.version_added;
};

const isFeatureSupported = (supportData) => {
  if (!supportData) return false;
  // TODO: Sometimes the support data for a given browser is an array, not a single object.
  // But web-features doesn't take this into account when building. To investigate.
  // if (typeof supportData === Array) {
  //   supportData = supportData[0]
  // }
  const version = supportData.version_added;
  return (
    supportData.partial_implementation !== true &&
    !!version &&
    version !== "preview"
  );
};

const calculateReleaseGap = (
  mainBrowser,
  webviewBrowser,
  mainVersion,
  webviewVersion,
) => {
  if (
    typeof mainVersion !== "string" ||
    typeof webviewVersion !== "string" ||
    mainVersion === "preview" ||
    webviewVersion === "preview"
  ) {
    return undefined;
  }

  const browsers = bcd.browsers;
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });

  const mainVersionSanitized = mainVersion.split("-")[0];
  const webviewVersionSanitized = webviewVersion.split("-")[0];

  const mainReleaseData = browsers[mainBrowser].releases;
  const webviewReleaseData = browsers[webviewBrowser].releases;

  const mainRelease = mainReleaseData[mainVersionSanitized];
  const webviewRelease = webviewReleaseData[webviewVersionSanitized];

  if (!mainRelease?.release_date || !webviewRelease?.release_date) {
    return undefined;
  }

  const mainDate = new Date(mainRelease.release_date);
  const webviewDate = new Date(webviewRelease.release_date);
  const timeDiff = webviewDate.getTime() - mainDate.getTime();
  const dayDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));

  const allVersions = Object.keys(mainReleaseData).sort((a, b) =>
    collator.compare(a, b),
  );
  const mainIndex = allVersions.indexOf(mainVersionSanitized);
  const webviewIndex = allVersions.indexOf(webviewVersionSanitized);

  if (mainIndex === -1 || webviewIndex === -1) {
    return undefined;
  }

  const versionsDiff = Math.abs(webviewIndex - mainIndex);
  if (versionsDiff > 0 || dayDiff !== 0) {
    return {
      versions: versionsDiff,
      time: dayDiff,
    };
  }

  return undefined;
};

const addWebviewSupport = (feature_id, feature) => {
  if (overrides[feature_id]) {
    return {
      ...feature,
      webview_support: overrides[feature_id],
    };
  }
  const featureCopy = JSON.parse(JSON.stringify(feature));
  const webview_support = {
    all: "supported",
    android: "supported",
    ios: "supported",
  };

  const compatKeys = featureCopy.status?.by_compat_key ?? {};

  const compatKeysBaseline = Object.entries(compatKeys)
    .filter(([, bcdKeyData]) => bcdKeyData.baseline)
    .map(([bcdKey]) => bcdKey);

  let androidBcdKeysWithSupport = 0;
  let iosBcdKeysWithSupport = 0;

  for (const bcdKey in compatKeys) {
    const bcdKeyFullData = resolveBcdKey(bcdKey);
    if (!bcdKeyFullData?.__compat?.support) continue;

    const support = bcdKeyFullData.__compat.support;
    if (isFeatureSupported(support.chrome_android)) {
      androidBcdKeysWithSupport++;
    }
    if (isFeatureSupported(support.safari_ios)) {
      iosBcdKeysWithSupport++;
    }

    // Augment webview_support object
    compatKeys[bcdKey].webview_support = {
      android: getWebViewSupportVersion(support.webview_android),
      ios: getWebViewSupportVersion(support.webview_ios),
      android_gap: calculateReleaseGap(
        "chrome_android",
        "webview_android",
        support.chrome_android?.version_added,
        support.webview_android?.version_added,
      ),
      ios_gap: calculateReleaseGap(
        "safari_ios",
        "webview_ios",
        support.safari_ios?.version_added,
        support.webview_ios?.version_added,
      ),
    };

    // Check for support discrepancies
    if (
      isFeatureSupported(support.chrome_android) &&
      !isFeatureSupported(support.webview_android)
    ) {
      webview_support.android = "partial";
      (webview_support.android_unsupported_compat_features ??= []).push(bcdKey);
    }
    if (
      isFeatureSupported(support.safari_ios) &&
      !isFeatureSupported(support.webview_ios)
    ) {
      webview_support.ios = "partial";
      (webview_support.ios_unsupported_compat_features ??= []).push(bcdKey);
    }
  }
  const androidUnsupportedBaseline =
    webview_support.android_unsupported_compat_features?.filter((key) =>
      compatKeysBaseline.includes(key),
    ) ?? [];
  if (
    (compatKeysBaseline.length > 0 &&
      androidUnsupportedBaseline.length === compatKeysBaseline.length) ||
    (compatKeysBaseline.length === 0 &&
      (webview_support.android_unsupported_compat_features?.length ?? 0) ===
        androidBcdKeysWithSupport)
  ) {
    webview_support.android = "unsupported";
  }

  const iosUnsupportedBaseline =
    webview_support.ios_unsupported_compat_features?.filter((key) =>
      compatKeysBaseline.includes(key),
    ) ?? [];
  if (
    (compatKeysBaseline.length > 0 &&
      iosUnsupportedBaseline.length === compatKeysBaseline.length) ||
    (compatKeysBaseline.length === 0 &&
      (webview_support.ios_unsupported_compat_features?.length ?? 0) ===
        iosBcdKeysWithSupport)
  ) {
    webview_support.ios = "unsupported";
  }

  if (
    webview_support.android === "unsupported" &&
    webview_support.ios === "unsupported"
  ) {
    webview_support.all = "unsupported";
  }

  if (
    (webview_support.android === "supported" &&
      webview_support.ios === "unsupported") ||
    (webview_support.android === "unsupported" &&
      webview_support.ios === "supported" &&
      webview_support.android === "supported" &&
      webview_support.ios === "partial") ||
    (webview_support.android === "partial" &&
      webview_support.ios === "supported")
  ) {
    webview_support.all = "partial";
  }

  return {
    ...feature,
    webview_support,
    status: {
      ...feature.status,
      by_compat_key: compatKeys,
    },
  };
};

function getWebFeatureWithWebview(feature_id) {
  let feature = webFeatures[feature_id];
  if (feature.kind === "moved") {
    const movedFeature = feature;
    feature = webFeatures[movedFeature.redirect_target];
  }
  if (feature.kind !== "feature") {
    throw new Error(
      `Feature with id "${feature_id}" is not of kind "feature".`,
    );
  }

  return addWebviewSupport(feature_id, feature);
}

function getAllFeaturesWithWebview() {
  const output = {};
  Object.entries(webFeatures).forEach(([id, feature]) => {
    if (feature.kind === "feature") {
      let featureWithWebview = getWebFeatureWithWebview(id);
      output[id] = featureWithWebview;
    } else {
      output[id] = feature;
    }
  });
  return output;
}

const features = getAllFeaturesWithWebview();

fs.writeFileSync(
  path.resolve(__dirname, "../src/data.json"),
  JSON.stringify(features),
);

console.log("data.json generated successfully.");
