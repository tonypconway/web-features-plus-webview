import bcd from '@mdn/browser-compat-data' with { type: "json"};
import { features as webFeatures } from 'web-features';
import { FeatureData, FeatureMovedData, FeatureSplitData } from 'web-features/types';

type WebviewSupportData = {
  all: string;
  android: string;
  android_unsupported_compat_features?: string[];
  ios: string;
  ios_unsupported_compat_features?: string[];
}

interface FeatureDataPlusWebview extends FeatureData {
  webview_support: WebviewSupportData;
  status: FeatureData['status'] & {
    by_compat_key: {
      [compatKey: string]: NonNullable<FeatureData['status']['by_compat_key']>[string] & {
        webview_support?: {
          android: boolean;
          ios: boolean;
        }
      }
    }
  }
}

const resolveBcdKey = (keyString: string): any => {
  let bcdEntry = bcd;
  const splitKeys = keyString.split(".");
  splitKeys.forEach(key => {
    bcdEntry = (bcdEntry as any)[key]
  });
  return bcdEntry;
}

const addWebviewSupport = (feature: FeatureData): FeatureDataPlusWebview => {

  let webview_support: WebviewSupportData = {
    all: "supported",
    android: "supported",
    ios: "supported",
  }

  let featureBaselineStatus = feature.status.baseline;

  let compatKeys = feature.status.by_compat_key ?? {};

  let compatKeysBaseline = Object.entries(compatKeys).reduce((acc, [bcdKey, bcdKeyData]) => {
    return bcdKeyData.baseline != false ? [...acc, bcdKey] : acc
  }, [] as string[])

  // Augment all the by_compat_keys with an object that shows 
  Object.entries(compatKeys).forEach(([bcdKey,]) => {
    let bcdKeyFullData = resolveBcdKey(bcdKey);
    let androidWebviewSupport = bcdKeyFullData.__compat.support.webview_android.partial_implementation === true ? false : bcdKeyFullData.__compat.support.webview_android.version_added;
    let iosWebviewSupport = bcdKeyFullData.__compat.support.webview_ios.partial_implementation === true ? false : bcdKeyFullData.__compat.support.webview_ios.version_added;
    compatKeys[bcdKey].webview_support = {
      android: androidWebviewSupport === false ? false : true,
      ios: iosWebviewSupport === false ? false : true,
    }
  })

  Object.entries(compatKeys).forEach(([bcdKey, bcdKeyData]) => {
    // Skip BCD key features that are not part of Baseline
    if (bcdKeyData.baseline != false) {
      // Handle BCD keys that are Baseline but not supported in Android webview
      if (bcdKeyData.webview_support.android === false) {
        webview_support.all = "partial";
        webview_support.android = "partial";
        if (!webview_support.android_unsupported_compat_features) {
          webview_support.android_unsupported_compat_features = [];
        }
        webview_support.android_unsupported_compat_features.push(bcdKey);
      }
      // Handle BCD keys that are Baseline but not supported in iOS webview
      if (bcdKeyData.webview_support.ios === false) {
        webview_support.all = "partial";
        webview_support.ios = "partial";
        if (!webview_support.ios_unsupported_compat_features) {
          webview_support.ios_unsupported_compat_features = [];
        }
        webview_support.ios_unsupported_compat_features.push(bcdKey);
      }
    }
  });

  let androidUnsupportedCompatFeatureString: string = webview_support.android_unsupported_compat_features?.sort().join(",") ?? '';
  let iosUnsupportedCompatFeatureString: string = webview_support.ios_unsupported_compat_features?.sort().join(",") ?? '';
  let featureUnsupportedCompatFeatureString: string = compatKeysBaseline.sort().join(",") ?? '';

  if ((androidUnsupportedCompatFeatureString === featureUnsupportedCompatFeatureString)
    &&
    webview_support.android != "supported") {
    webview_support.android = 'unsupported';
  }
  if (iosUnsupportedCompatFeatureString === featureUnsupportedCompatFeatureString
    &&
    webview_support.ios != "supported"
  ) {
    webview_support.ios = 'unsupported';
  }

  if (webview_support.android === "unsupported" && webview_support.ios === "unsupported") {
    webview_support.all = "unsupported"
  }

  let featurePlusWebviewData: FeatureDataPlusWebview = {
    ...feature,
    webview_support,
    status: {
      ...feature.status,
      by_compat_key: compatKeys,
    },
  };

  return featurePlusWebviewData
}

function getWebFeatureWithWebview(feature_id: string): FeatureDataPlusWebview {
  let feature = webFeatures[feature_id];
  if (feature.kind === "moved") {
    const movedFeature = feature as { kind: "moved"; redirect_target: string };
    feature = webFeatures[movedFeature.redirect_target];
  }
  if (feature.kind !== "feature") {
    throw new Error(`Feature with id "${feature_id}" is not of kind "feature".`);
  }

  return addWebviewSupport(feature);
}

function getAllFeaturesWithWebview(): { [key: string]: FeatureDataPlusWebview | FeatureMovedData | FeatureSplitData } {
  const output: { [key: string]: FeatureDataPlusWebview | FeatureMovedData | FeatureSplitData } = {};
  Object.entries(webFeatures).forEach(([id, feature]) => {
    if (feature.kind === "feature") {
      let featureWithWebview = getWebFeatureWithWebview(id);
      output[id] = featureWithWebview;
    } else {
      output[id] = feature;
    }
  })
  return output
}

const features: { [key: string]: FeatureDataPlusWebview | FeatureMovedData | FeatureSplitData } = getAllFeaturesWithWebview();

export { features };