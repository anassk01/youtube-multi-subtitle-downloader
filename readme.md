# YouTube Smart Subtitle Downloader

A powerful and user-friendly browser userscript for downloading YouTube subtitles. This script allows you to download subtitles from single videos or bulk download from multiple videos at once.

## Features

- 📝 Download subtitles from any YouTube video
- 📦 Bulk download subtitles from multiple videos
- 🔍 Smart video selection in playlists and search results
- 💾 Multiple format support (SRT and plain text)
- 📋 Copy subtitles to clipboard
- 🌐 Support for all available subtitle languages
- 🎯 Easy-to-use interface with visual feedback
- ⚡ Efficient video processing with error handling

## Installation

1. First, install a userscript manager for your browser:
   - [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
   - [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
   - [Violentmonkey](https://violentmonkey.github.io/)

2. Click on the script's install link or copy the script code into your userscript manager.

3. The script will automatically run when you visit YouTube.

## Usage

### Single Video Download
1. Navigate to any YouTube video
2. Click on the Tampermonkey icon and select "Download Current Video Subtitles"
3. Select the desired subtitle language(s) and format
4. Click "Download Selected" or "Copy Selected"

### Bulk Download
1. Go to any YouTube page with multiple videos (playlist, channel, search results)
2. Click on the Tampermonkey icon and select "Select Videos for Subtitles"
3. Check the boxes next to the videos you want to download subtitles from
4. Click the "Download" button in the top-right corner
5. Select languages and format for each video
6. Click "Download Selected" or "Copy Selected"

## Supported Formats

- **SRT**: Standard subtitle format with timing information
- **Plain Text**: Simple text format with only the subtitle content

## Features in Detail

### Smart Video Selection
- Automatically excludes YouTube Shorts
- Works with different video layout types
- Preserves selection state during page navigation

### UI Components
- Loading indicators for feedback
- Toast notifications for status updates
- Modal dialogs for subtitle selection
- Checkbox overlays for video selection

### Error Handling
- Graceful handling of videos without subtitles
- Network error recovery
- Clear user feedback for all operations

## Technical Details

The script is built with modern JavaScript and includes:
- Modular class-based architecture
- Promise-based async operations
- XML parsing for subtitle conversion
- DOM manipulation for UI elements

## Requirements

- Modern web browser (Chrome, Firefox, Edge, etc.)
- Userscript manager extension
- Active internet connection
- JavaScript enabled

## Known Limitations

- Cannot download auto-generated subtitles
- May not work with embedded YouTube videos
- Some subtitle formats may not preserve styling

## Troubleshooting

If you encounter issues:

1. **Subtitles Not Loading**
   - Ensure the video has subtitles available
   - Check your internet connection
   - Try refreshing the page

2. **Download Not Working**
   - Check browser download permissions
   - Ensure you have selected at least one subtitle
   - Try a different subtitle format

3. **Selection Mode Issues**
   - Refresh the page
   - Disable and re-enable the script
   - Check for conflicts with other YouTube scripts

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

anassk

## Version History

- 1.1: Enhanced code structure and improved error handling
- 1.0: Initial release with basic functionality

## Acknowledgments

- Thanks to the YouTube API
- Inspired by various subtitle download tools
- Built with modern JavaScript practices

## Support

For support, please:
1. Check the troubleshooting section
2. Submit an issue on the project repository
3. Contact the author through the userscript platform

---

Made with ❤️ for the YouTube community