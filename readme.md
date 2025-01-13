# YouTube Multi Subtitle Downloader (Tampermonkey Version)

This is a userscript designed to run with **Tampermonkey** that allows you to easily download subtitles in multiple languages from YouTube videos.

## Features

*   **Download subtitles in SRT or Plain Text:** Supports downloading subtitles in the widely used SRT format or as plain text.
*   **Select multiple languages:** Download subtitles in different languages if they are available for the video.
*   **Copy subtitles to clipboard:** Conveniently copy the subtitle text to your clipboard for use in other applications.
*   **Simple and intuitive UI:** Integrates seamlessly with the YouTube interface without being obtrusive.
*   **Handles dynamic content:** Works correctly even as YouTube loads content dynamically without full page reloads.
*   **Bulk Download (Experimental):** Select and download subtitles from multiple videos on search results, channel pages, and home page.

## Installation (Tampermonkey)

1. **Install Tampermonkey:**
    *   **Chrome:** [https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    *   **Firefox:** [https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
    *   **Edge:** [https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
    *   **Safari:** [https://www.tampermonkey.net/](https://www.tampermonkey.net/) (Follow the instructions for Safari on the Tampermonkey website)

2. **Install the YouTube Multi Subtitle Downloader userscript:**
    *   Click on this link to install the script directly from GitHub:

        ```
        https://raw.githubusercontent.com/anassk01/youtube-subtitle-downloader/main/main.js
        ```
        (Make sure you replace this with the actual raw GitHub link to your `main.js` script)
    *   **OR**
    *   Click the Tampermonkey icon in your browser's toolbar.
    *   Select "Create a new script..."
    *   Copy the entire content of the `main.js` file from this repository.
    *   Paste the code into the Tampermonkey editor.
    *   Save the script (File > Save or Ctrl+S).

## Usage

### Single Video Mode

1. Go to any YouTube video page.
2. You'll see a new "Download Subtitles" button added below the video player.
3. Click the button to fetch available subtitles.
4. Select the languages and format (SRT or Plain Text) you want to download.
5. Click "Download" to download the selected subtitles or "Copy" to copy them to your clipboard.

### Bulk Video Mode (Experimental)

1. Go to a YouTube search results page, a channel's videos page, or the YouTube homepage.
2. You'll see a "Get Videos Sub" button in the top-right corner.
3. Clicking the "Get Videos Sub" button enters selection mode:
    *   Checkboxes will appear next to each video.
    *   Select the videos you want to download subtitles from.
    *   You can also use the "Select All" checkbox to select/deselect all visible videos.
4. Once you've selected the videos, click the button again (which now says "Download Subtitles").
5. A dialog will appear, allowing you to select the languages and format for each video.
6. Click "Download Selected" or "Copy Selected" to download or copy the subtitles.

## Important Notes (Tampermonkey)

*   **Tampermonkey Permissions:** Make sure that Tampermonkey has permission to access `*.youtube.com/*` websites. You can check this in Tampermonkey's settings.
*   **Script Updates:** Tampermonkey should automatically check for script updates. However, you might need to manually update the script if you make changes to the code in your GitHub repository. To manually update:
    1. Go to the Tampermonkey dashboard.
    2. Find the "YouTube Multi Subtitle Downloader" script.
    3. Click the "Edit" icon.
    4. Replace the old code with the new code from your updated script file.
    5. Save the changes.

## Limitations

*   **No VTT Support:** The script currently does not support downloading subtitles in the VTT format, only SRT and Plain Text formats.
*   **Bulk Mode is Experimental:** The bulk download feature might have some bugs or unexpected behavior. Please report any issues you encounter.

## Can it be a "Real" Extension?

Yes, absolutely! Your userscript can be relatively easily adapted into a standalone browser extension. Here's a general outline of what's involved:

1. **Create a `manifest.json` file:** This file describes your extension to the browser (name, description, permissions, etc.).
2. **Modify the code (if needed):**
    *   Remove any Tampermonkey-specific directives (like `@grant` for certain API functions if you are not going to use them). You'll use browser extension APIs instead.
    *   Replace Tampermonkey functions (e.g., `GM_xmlhttpRequest`) with their browser extension API equivalents (e.g., `fetch` or `chrome.runtime.sendMessage`).
3. **Package and distribute:**
    *   You can load the extension in developer mode in your browser for testing.
    *   To distribute it to others, you'll need to package it as a `.crx` (Chrome) or `.xpi` (Firefox) file and potentially publish it on the Chrome Web Store or Firefox Add-ons store.

## Contributing

If you'd like to contribute to the development of this script, feel free to fork the repository, make your changes, and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE) - see the `LICENSE` file for details. (You should create a LICENSE file in your repository and choose an appropriate license).
