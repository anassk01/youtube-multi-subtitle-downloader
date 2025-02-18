# YouTube Smart Subtitle Downloader (Tampermonkey Version)

This is an enhanced userscript designed to run with **Tampermonkey** that allows you to easily download subtitles from YouTube videos, with a focus on smart selection and improved code structure.  It provides both single-video and bulk-download capabilities.

## Features

*   **Download subtitles in SRT or Plain Text:**  Supports both SRT and plain text formats.
*   **Smart Language Selection:**  Select from available subtitle languages for each video.
*   **Copy to Clipboard:**  Copy subtitle text directly to your clipboard.
*   **Intuitive UI:** Integrates seamlessly with the YouTube interface.
*   **Robust Dynamic Content Handling:**  Works reliably with YouTube's dynamic page loading.
*   **Bulk Download:**  Select and download subtitles from multiple videos on search results, channel pages, playlists, home page, and more!
*   **User-Friendly Menu Commands:** Access key features directly from the Tampermonkey menu.
*    **Playlist Support:** download Subtitle from playlist.

## Installation (Tampermonkey)

1.  **Install Tampermonkey:**
    *   **Chrome:** [https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    *   **Firefox:** [https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
    *   **Edge:** [https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
    *   **Safari:** [https://www.tampermonkey.net/](https://www.tampermonkey.net/) (Follow the instructions for Safari on the Tampermonkey website)

2.  **Install the YouTube Smart Subtitle Downloader userscript:**
    *   Click on this link to install the script directly:

        ```
        https://raw.githubusercontent.com/anassk01/youtube-subtitle-downloader/main/main.js
        ```
        (Make sure this points to the *raw* version of your `main.js` file on your `main` branch.)
    *   **OR**
    *   Click the Tampermonkey icon in your browser's toolbar.
    *   Select "Create a new script..."
    *   Copy the entire content of the `main.js` file.
    *   Paste the code into the Tampermonkey editor.
    *   Save the script (File > Save or Ctrl+S).

## Usage

### Single Video Download

1.  Go to a YouTube video page.
2.  Click the Tampermonkey icon in your browser toolbar.
3.  Select "Download Current Video Subtitles" from the menu.
4.  Choose the desired languages and format (SRT or Plain Text).
5.  Click "Download Selected" or "Copy Selected".

### Bulk Video Download

1.  Go to a YouTube search results page, channel page, playlist, or the homepage.
2.  Click the Tampermonkey icon in your browser toolbar.
3.  Select "Select Videos for Subtitles" from the menu.
4.  Checkboxes will appear next to each video.  Select the videos you want.
5.  Click the "Download" button that appears in the top-right corner.
6.  Select languages and format for each video in the dialog.
7.  Click "Download Selected" or "Copy Selected".

## Important Notes (Tampermonkey)

*   **Permissions:** Ensure Tampermonkey has permission to access `*.youtube.com/*` websites.
*   **Updates:** Tampermonkey should automatically check for updates.  To update manually:
    1.  Go to the Tampermonkey dashboard.
    2.  Find the script.
    3.  Click "Edit".
    4.  Replace the old code with the new code.
    5.  Save.

## Limitations

*   **No VTT Support:**  Only SRT and Plain Text formats are supported.

## Can it be a "Real" Extension?

Yes!  Your userscript can be adapted into a standalone browser extension.  The main steps are:

1.  **Create a `manifest.json`:** Describes your extension (name, permissions, etc.).
2.  **Modify Code:**
    *   Remove Tampermonkey-specific directives (e.g., `@grant`).
    *   Replace Tampermonkey functions with browser extension API equivalents.
3.  **Package and Distribute:** Package the extension and potentially publish it on extension stores.

## Contributing

Contributions are welcome!  Fork the repository, make changes, and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE) (You should create a LICENSE file).