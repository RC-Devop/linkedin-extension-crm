# LinkedIn CRM Checker Extension

This Chrome extension allows you to easily add LinkedIn profiles to your CRM system.

## Setup and Installation

1. **Create the icon files**:
   - Create an `icons` folder in the project root
   - Add icon files in the following sizes:
     - icon16.png (16x16 pixels)
     - icon48.png (48x48 pixels)
     - icon128.png (128x128 pixels)
   - Also create disabled versions:
     - icon16-disabled.png
     - icon48-disabled.png
     - icon128-disabled.png

2. **Rename the manifest file**:
   - Rename `manifests.json` to `manifest.json`

3. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right corner)
   - Click "Load unpacked" and select the extension folder
   - The extension should now appear in your extensions list

## How to Use

1. Navigate to any LinkedIn profile page (URL containing `linkedin.com/in/`)
2. Click the extension icon in the Chrome toolbar
3. The extension will automatically extract profile information
4. Click the "Add to CRM" button to save the contact to your CRM system
5. A success or error message will be displayed

## Files Overview

- `manifest.json`: Extension configuration
- `popup.html`: The extension popup UI
- `popup.js`: Handles the popup logic and API calls
- `content.js`: Extracts data from LinkedIn profile pages
- `background.js`: Background processes and extension lifecycle
- `styles.css`: Styling for the popup

## API Integration

The extension is configured to send data to `https://apitest.sales-buddy.in/api/contact/postSingleContact`.

## Troubleshooting

- If the extension icon is disabled, make sure you're on a LinkedIn profile page
- If data extraction fails, try refreshing the page
- Check the browser console for any error messages 