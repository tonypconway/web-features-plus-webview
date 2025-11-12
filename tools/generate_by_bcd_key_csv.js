import { features } from "web-features-plus-webview";
import { mkConfig, generateCsv, download } from "export-to-csv";

import * as fs from "fs";

const data = [];

const determineBrowserSupport = (feature, browser, bcdKey = "") => {
  if (feature.discouraged) {
    return "discouraged";
  }
  if (bcdKey != "") {
    if (feature.status.by_compat_key[bcdKey].support[browser]) {
      return "supported";
    }
  } else {
    if (feature.status.support[browser]) {
      return "supported";
    }
  }

  return "unsupported";
};

for (const featureId in features) {
  const feature = features[featureId];

  if (feature.kind !== "feature" || !feature?.status?.by_compat_key) {
    continue;
  }

  if (featureId === "alternative-style-sheets") {
    console.log(feature);
  }

  for (const bcdKey in feature.status.by_compat_key) {
    if (featureId === "alternative-style-sheets") {
      console.log(feature.status.by_compat_key);
    }
    const row = {
      "feature ID": featureId,
      "BCD key": bcdKey,
      "overall baseline status": feature.discouraged
        ? "discouraged"
        : feature.status.baseline,
      "key baseline status":
        feature.status.by_compat_key[bcdKey].baseline ?? false,
      webview_support_overall: feature.webview_support.all,
      chrome_android_overall: determineBrowserSupport(
        feature,
        "chrome_android",
      ),
      webview_android_overall: feature.webview_support.android,
      chrome_android_key: determineBrowserSupport(
        feature,
        "chrome_android",
        bcdKey,
      ),
      webview_android_key:
        feature.status.by_compat_key[bcdKey]?.webview_support?.android,
      safari_ios_overall: determineBrowserSupport(feature, "safari_ios"),
      webview_ios_overall: feature.webview_support.ios,
      safari_ios_key: determineBrowserSupport(feature, "safari_ios", bcdKey),
      webview_ios_key:
        feature.status.by_compat_key[bcdKey]?.webview_support?.ios,
    };

    data.push(row);
  }
}

const options = mkConfig({
  fieldSeparator: ",",
  quoteStrings: '"',
  decimalSeparator: ".",
  showLabels: true,
  showTitle: false,
  useTextFile: false,
  useBom: true,
  useKeysAsHeaders: true,
});

// const csvExporter = new CsvExporter(options);
const csvData = generateCsv(options)(data);

fs.writeFileSync("features_by_bcd_key.csv", csvData);

console.log("features_by_bcd_key.csv generated successfully.");
