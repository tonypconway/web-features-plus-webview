import bcd from '@mdn/browser-compat-data' with { type: "json"};
import { features as webFeatures } from 'web-features';
import { FeatureData, FeatureMovedData, FeatureSplitData } from 'web-features/types';

type WebviewSupportData = {
  all: boolean;
  android: boolean;
  android_unsupported_compat_features?: string[];
  ios: boolean;
  ios_unsupported_compat_features?: string[];
}

interface FeatureDataPlusWebview extends FeatureData {
  webview_support: WebviewSupportData
}

const resolveBcdKey = (keyString: string): any => {
  let bcdEntry = bcd;
  const splitKeys = keyString.split(".");
  splitKeys.forEach(key => {
    bcdEntry = (bcdEntry as any)[key]
  });
  return bcdEntry;
}

const calculateWebviewSupport = (feature: FeatureData): WebviewSupportData => {

  let webview_support: WebviewSupportData = {
    all: true,
    android: true,
    ios: true,
  }

  if (feature.compat_features) {
    feature.compat_features.forEach(bcdKey => {
      let bcdFeatureSupport = resolveBcdKey(bcdKey).__compat.support;

      if (
        (
          bcdFeatureSupport.webview_android.version_added === false
          ||
          bcdFeatureSupport.webview_ios.version_added === false
        )
        ||
        webview_support.all === false
      ) {
        webview_support.all = false;
      }

      if (
        bcdFeatureSupport.webview_android.version_added === false
        ||
        webview_support.android === false
      ) {
        webview_support.android = false;
        if (!webview_support.android_unsupported_compat_features) {
          webview_support.android_unsupported_compat_features = []
        }
        webview_support.android_unsupported_compat_features.push(bcdKey);
      }

      if (
        bcdFeatureSupport.webview_ios.version_added === false
        ||
        webview_support.ios === false
      ) {
        webview_support.ios = false;
        if (!webview_support.ios_unsupported_compat_features) {
          webview_support.ios_unsupported_compat_features = []
        }
        webview_support.ios_unsupported_compat_features.push(bcdKey);
      }
    });
  }

  return webview_support
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

  let webview_support = calculateWebviewSupport(feature)

  const constructedFeature: FeatureDataPlusWebview = {
    ...(feature as FeatureData),
    webview_support
  };
  return constructedFeature;
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