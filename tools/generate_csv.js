import { features } from "web-features-plus-webview";
import { mkConfig, generateCsv, download } from "export-to-csv";

import * as fs from "fs";

const data = [];

const determineBrowserSupport = (feature, browser) => {
  if (feature.status.support[browser]) {
    return "supported";
  }
  return "unsupported";
};

for (const featureId in features) {
  const feature = features[featureId];

  if (feature.kind !== "feature") {
    continue;
  }

  const row = {
    "feature ID": featureId,
    "baseline status": feature.status.baseline,
    "webview support": feature.webview_support.all,
    chrome_android: determineBrowserSupport(feature, "chrome_android"),
    webview_android: feature.webview_support.android,
    unsupported_compat_keys_android:
      feature.webview_support.android_unsupported_compat_features?.join(",") ??
      "",
    "safari_ios support": determineBrowserSupport(feature, "safari_ios"),
    webview_ios: feature.webview_support.ios,
    unsupported_compat_keys_ios:
      feature.webview_support.ios_unsupported_compat_features?.join(",") ?? "",
  };

  data.push(row);
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

fs.writeFileSync("features.csv", csvData);

console.log("features.csv generated successfully.");
