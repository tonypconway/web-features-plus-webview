# Web Features Plus WebView

This module exports an augmented version of the `features` object exported from `web-features`.

```javascript
import { features } from "web-features-plus-webview";
```

The features object uses the same web feature IDs you can find in `web-features` or the [Web Status dashboard](https://webstatus.dev), but with an additional property added to all objects with `kind: "feature"` and which are Baseline Newly or Widely available (i.e. `status.baseline === 'low' || status.baseline === 'high'`):

```javascript
webview_support: {
    all: "supported" | "partial" | "unsupported", // whether the feature is supported to the same level in all webviews as their corresponding browsers
    android: "supported" | "partial" | "unsupported", // whether the feature has equivalent support in Android webview as Chrome for Android
    ios: "supported" | "partial" | "unsupported", // whether the feature has equivalent support in iOS webviews as Safari for iOS
    // Arrays of @mdn/browser-compat-data keys indicating which features are unsupported by the named webview that are supported in their corresponding browser
    android_unsupported_compat_features?: array,
    ios_unsupported_compat_features?: array,
  }
```

In addition, in the `status.by_compat_key` object, each MDN key has a corresponding object indicating the webview support for that key:

```javascript
'mdn.bcd.key': {
  ...,
  webview_support: {
    android: boolean | string, // false or the version added
    ios: boolean | string, // false or the version added
    android_gap?: { // only included if there is a difference between Android Chrome and Webview Versions
      versions: number, // the number of versions difference
      time: number, // the number of days between the Chrome and Webview releases
    },
    ios_gap?: { // only included if there is a difference between iOS Safari and Webview Versions
      versions: number, // the number of versions difference
      time: number, // the number of days between the Safari and Webview releases
    }
  }
}
```

## Installation

```bash
npm install path/to/web-features-plus-webview
```

## Building from source

To build the module from source, you need to have Node.js and npm installed.

1. Clone the repository:

```bash
git clone https://github.com/your-username/web-features-plus-webview.git
```

2. Install the dependencies:

```bash
npm install
```

3. Build the module:

```bash
npm run build
```

The built module will be in the `dist` directory.
