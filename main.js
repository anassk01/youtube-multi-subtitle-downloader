// ==UserScript==
// @name          YouTube Multi Subtitle Downloader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Download subtitles from YouTube videos with enhanced features
// @author       anassk
// @match        https://www.youtube.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Core Types
    const Types = {
        SubtitleTrack: class {
            constructor(langCode, langName, baseUrl) {
                this.languageCode = langCode;
                this.languageName = langName;
                this.baseUrl = baseUrl;
            }
        },

        VideoData: class {
            constructor(id, title) {
                this.id = id;
                this.title = title;
                this.subtitles = [];
            }
        }
    };

    // Configuration
    const CONFIG = {
        MESSAGES: {
            NO_SUBTITLE: 'No Subtitles Available',
            HAVE_SUBTITLE: 'Available Subtitles',
            LOADING: 'Loading Subtitles...',
            COPY_SUCCESS: '✓ Copied!',
            ERROR: {
                COPY: 'Failed to copy to clipboard',
                FETCH: 'Failed to fetch subtitles',
                NO_VIDEO: 'No video found'
            }
        },

        SELECTORS: {
            VIDEO_CONTAINER: '#above-the-fold',
            VIDEO_ELEMENTS: 'ytd-video-renderer, ytd-compact-video-renderer',
            THUMBNAIL: 'a#thumbnail',
            VIDEO_TITLE: '#video-title'
        },

        TIMINGS: {
            PAGE_CHECK_INTERVAL: 1000,
            DOWNLOAD_DELAY: 500,
            COPY_SUCCESS_DURATION: 2000
        },

        FORMATS: {
            SRT: 'srt',
            TEXT: 'txt'
        }
    };

    // Core Utilities
    const Utils = {
        createError: (message, code, originalError = null) => {
            const error = new Error(message);
            error.code = code;
            error.originalError = originalError;
            return error;
        },

        debounce: (func, wait) => {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        safeJSONParse: (str, fallback = null) => {
            try {
                return JSON.parse(str);
            } catch (e) {
                console.error('JSON Parse Error:', e);
                return fallback;
            }
        },

        sanitizeFileName: (name) => {
            return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').substring(0, 100);
        }
    };

    // Event Bus for communication between modules
    class EventBus {
        constructor() {
            this.events = new Map();
        }

        on(event, callback) {
            if (!this.events.has(event)) {
                this.events.set(event, new Set());
            }
            this.events.get(event).add(callback);
            return () => this.off(event, callback);
        }

        off(event, callback) {
            const callbacks = this.events.get(event);
            if (callbacks) {
                callbacks.delete(callback);
            }
        }

        emit(event, data) {
            const callbacks = this.events.get(event);
            if (callbacks) {
                callbacks.forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`Error in event ${event}:`, error);
                    }
                });
            }
        }
    }

    // Export to global scope for other modules
    window.YTSubtitles = {
        Types,
        CONFIG,
        Utils,
        EventBus: new EventBus()
    };
})();


(function() {
    'use strict';

    const { Types, CONFIG, Utils } = window.YTSubtitles;

    class SubtitleProcessor {
        static async fetchSubtitleTracks(videoId) {
            try {
                const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
                const html = await response.text();

                const playerDataMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
                if (!playerDataMatch) return null;

                const playerData = Utils.safeJSONParse(playerDataMatch[1]);
                const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

                if (!captionTracks?.length) return null;

                return captionTracks.map(track => new Types.SubtitleTrack(
                    track.languageCode,
                    track.name.simpleText,
                    track.baseUrl
                ));
            } catch (error) {
                throw Utils.createError('Failed to fetch subtitles', 'SUBTITLE_FETCH_ERROR', error);
            }
        }

        static async getSubtitleContent(track, format = CONFIG.FORMATS.SRT) {
            try {
                const response = await fetch(track.baseUrl);
                const xml = await response.text();
                return format === CONFIG.FORMATS.SRT ?
                    this.convertToSRT(xml) :
                    this.convertToText(xml);
            } catch (error) {
                throw Utils.createError('Failed to fetch subtitle content', 'CONTENT_FETCH_ERROR', error);
            }
        }

        static convertToSRT(xml) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(xml, "text/xml");
                const textNodes = doc.getElementsByTagName('text');
                let srt = '';

                Array.from(textNodes).forEach((node, index) => {
                    const start = parseFloat(node.getAttribute('start'));
                    const duration = parseFloat(node.getAttribute('dur') || '0');
                    const end = start + duration;

                    srt += `${index + 1}\n`;
                    srt += `${this.formatTime(start)} --> ${this.formatTime(end)}\n`;
                    srt += `${node.textContent}\n\n`;
                });

                return srt;
            } catch (error) {
                throw Utils.createError('Failed to convert to SRT', 'SRT_CONVERSION_ERROR', error);
            }
        }

        static convertToText(xml) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(xml, "text/xml");
                const textNodes = doc.getElementsByTagName('text');

                return Array.from(textNodes)
                    .map(node => node.textContent.trim())
                    .filter(text => text)
                    .join('\n');
            } catch (error) {
                throw Utils.createError('Failed to convert to text', 'TEXT_CONVERSION_ERROR', error);
            }
        }

        static formatTime(seconds) {
            const pad = num => String(num).padStart(2, '0');
            const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, '0');

            seconds = Math.floor(seconds);
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;

            return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${ms}`;
        }

        static downloadSubtitle(content, filename) {
            const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        static async copyToClipboard(content) {
            try {
                await navigator.clipboard.writeText(content);
                return true;
            } catch (error) {
                throw Utils.createError('Failed to copy to clipboard', 'CLIPBOARD_ERROR', error);
            }
        }
    }

    // Export to global scope
    window.YTSubtitles.SubtitleProcessor = SubtitleProcessor;
})();

(function() {
    'use strict';

    const { CONFIG, Utils } = window.YTSubtitles;

    // UI Styles
    const STYLES = `
        .yt-sub-btn {
            background: #065fd4;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
            transition: background 0.2s;
        }

        .yt-sub-btn:hover {
            background: #0056c7;
        }

        .yt-sub-dialog {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            max-height: 80vh;
            overflow-y: auto;
            min-width: 300px;
            color: black;
        }

        .yt-sub-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999;
        }

        .yt-sub-track {
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }

        .yt-sub-loading {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            color: white;
            flex-direction: column;
            gap: 10px;
        }

        .yt-sub-spinner {
            width: 30px;
            height: 30px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #065fd4;
            border-radius: 50%;
            animation: yt-sub-spin 1s linear infinite;
        }

        @keyframes yt-sub-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    class UIComponents {
        static injectStyles() {
            const style = document.createElement('style');
            style.textContent = STYLES;
            document.head.appendChild(style);
        }

        static createButton(text, onClick, className = '') {
            const button = document.createElement('button');
            button.className = `yt-sub-btn ${className}`;
            button.textContent = text;
            button.addEventListener('click', onClick);
            return button;
        }

        static createDialog({ title, content, onClose }) {
            const overlay = document.createElement('div');
            overlay.className = 'yt-sub-overlay';

            const dialog = document.createElement('div');
            dialog.className = 'yt-sub-dialog';

            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.marginBottom = '15px';

            const titleElem = document.createElement('h2');
            titleElem.textContent = title;
            titleElem.style.margin = '0';

            const closeBtn = this.createButton('×', () => {
                onClose();
                overlay.remove();
            }, 'close-btn');
            closeBtn.style.padding = '5px 10px';

            header.appendChild(titleElem);
            header.appendChild(closeBtn);
            dialog.appendChild(header);
            dialog.appendChild(content);
            overlay.appendChild(dialog);

            return overlay;
        }

        static createSubtitleDialog(tracks, options = {}) {
            const content = document.createElement('div');

            // Format selector
            const formatDiv = document.createElement('div');
            formatDiv.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <label style="margin-right: 10px;">
                        <input type="radio" name="format" value="srt" checked> SRT
                    </label>
                    <label>
                        <input type="radio" name="format" value="txt"> Plain Text
                    </label>
                </div>
            `;

            // Tracks list
            const tracksList = document.createElement('div');
            tracks.forEach(track => {
                const trackDiv = document.createElement('div');
                trackDiv.className = 'yt-sub-track';
                trackDiv.innerHTML = `
                    <label>
                        <input type="checkbox" value="${track.languageCode}">
                        ${track.languageName}
                    </label>
                `;
                tracksList.appendChild(trackDiv);
            });

            // Action buttons
            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.justifyContent = 'flex-end';
            actions.style.gap = '10px';
            actions.style.marginTop = '20px';

            if (options.onDownload) {
                actions.appendChild(this.createButton('Download', options.onDownload));
            }
            if (options.onCopy) {
                actions.appendChild(this.createButton('Copy', options.onCopy));
            }

            content.appendChild(formatDiv);
            content.appendChild(tracksList);
            content.appendChild(actions);

            return content;
        }

        static showLoading(message = CONFIG.MESSAGES.LOADING) {
            const overlay = document.createElement('div');
            overlay.className = 'yt-sub-overlay';

            const loading = document.createElement('div');
            loading.className = 'yt-sub-loading';

            const spinner = document.createElement('div');
            spinner.className = 'yt-sub-spinner';

            const text = document.createElement('div');
            text.textContent = message;

            loading.appendChild(spinner);
            loading.appendChild(text);
            overlay.appendChild(loading);

            document.body.appendChild(overlay);
            return overlay;
        }

        static removeLoading(loadingElement) {
            if (loadingElement && loadingElement.parentElement) {
                loadingElement.remove();
            }
        }

        static showToast(message, duration = 2000) {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                z-index: 10001;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => toast.remove(), duration);
        }
    }

    // Export to global scope
    window.YTSubtitles.UIComponents = UIComponents;

    // Initialize styles
    UIComponents.injectStyles();
})();


(function() {
    'use strict';

    const { Types, CONFIG, Utils, UIComponents, SubtitleProcessor } = window.YTSubtitles;

class VideoManager {
    constructor() {
        this.singleMode = null;
        this.bulkMode = null;
        this.lastPageType = null;
        this.initialized = false;
        console.debug('[VideoManager] Created new instance');
        this.initialize();
    }

    initialize() {
        if (this.initialized) {
            console.debug('[VideoManager] Already initialized, skipping');
            return;
        }

        console.debug('[VideoManager] Initializing');
        // Always initialize bulkMode
        this.bulkMode = new BulkVideoMode();
        this.bulkMode.initialize();

        this.handlePageChange();
        this.setupPageObserver();
        this.initialized = true;
    }

    setupPageObserver() {
        console.debug('[VideoManager] Setting up page observer');
        const observer = new MutationObserver(
            Utils.debounce(() => {
                const currentPageType = this.getPageType();
                if (currentPageType !== this.lastPageType) {
                    console.debug(`[VideoManager] Page type changed from ${this.lastPageType} to ${currentPageType}`);
                    this.handlePageChange();
                }
            }, 500)
        );

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        document.addEventListener('yt-navigate-finish', () => {
            console.debug('[VideoManager] Navigation event detected');
            this.handlePageChange();
        });
    }

    handlePageChange() {
        const pageType = this.getPageType();
        console.debug(`[VideoManager] Handling page change. Current: ${pageType}, Last: ${this.lastPageType}`);

        // Handle SingleVideoMode
        if (pageType === 'watch') {
            if (!this.singleMode) {
                console.debug('[VideoManager] Initializing SingleVideoMode');
                this.singleMode = new SingleVideoMode();
                this.singleMode.initialize();
            }
        } else {
            if (this.singleMode) {
                console.debug('[VideoManager] Cleaning up SingleVideoMode');
                this.singleMode.cleanup();
                this.singleMode = null;
            }
        }

        // BulkMode is always active, just make sure it's initialized
        if (!this.bulkMode) {
            console.debug('[VideoManager] Reinitializing BulkVideoMode');
            this.bulkMode = new BulkVideoMode();
            this.bulkMode.initialize();
        }

        this.lastPageType = pageType;
    }

    getPageType() {
        const path = window.location.pathname;
        if (path === '/watch') return 'watch';
        if (path === '/results') return 'search';
        if (path === '/') return 'home';
        return 'other';
    }
}
class SingleVideoMode {
    constructor() {
        this.videoId = null;
        this.subtitleTracks = null;
        this.downloadButton = null;
        this.currentVideoUrl = null;
        this.videoObserver = null;
        console.debug('[SingleVideoMode] Created new instance');
    }

    async initialize() {
        console.debug('[SingleVideoMode] Initializing');
        this.setupVideoObserver();
        await this.initializeButton();
    }

    setupVideoObserver() {
        console.debug('[SingleVideoMode] Setting up video observer');
        // Watch for changes to the video player
        this.videoObserver = new MutationObserver(
            Utils.debounce(() => {
                const newVideoUrl = window.location.href;
                if (this.currentVideoUrl !== newVideoUrl) {
                    console.debug(`[SingleVideoMode] Video URL changed from ${this.currentVideoUrl} to ${newVideoUrl}`);
                    this.handleVideoChange();
                }
            }, 500)
        );

        const playerApp = document.querySelector('ytd-app');
        if (playerApp) {
            this.videoObserver.observe(playerApp, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['video-id']
            });
        }

        // Also listen for YouTube's navigation events
        document.addEventListener('yt-navigate-finish', () => {
            console.debug('[SingleVideoMode] Navigation event detected');
            this.handleVideoChange();
        });
    }

    async handleVideoChange() {
        console.debug('[SingleVideoMode] Handling video change');
        const newVideoId = this.extractVideoId();
        const newVideoUrl = window.location.href;

        if (this.videoId !== newVideoId || this.currentVideoUrl !== newVideoUrl) {
            console.debug(`[SingleVideoMode] Video changed from ${this.videoId} to ${newVideoId}`);
            this.videoId = newVideoId;
            this.currentVideoUrl = newVideoUrl;
            this.subtitleTracks = null;
            await this.initializeButton();
        }
    }

    async initializeButton() {
        console.debug('[SingleVideoMode] Initializing button');
        this.videoId = this.extractVideoId();
        if (!this.videoId) {
            console.debug('[SingleVideoMode] No video ID found');
            return;
        }

        // Remove existing button if present
        if (this.downloadButton) {
            console.debug('[SingleVideoMode] Removing existing button');
            this.downloadButton.remove();
        }

        await this.addDownloadButton();
    }

    extractVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    }

    async addDownloadButton() {
        try {
            const container = await this.waitForElement(CONFIG.SELECTORS.VIDEO_CONTAINER);
            if (!container) {
                console.debug('[SingleVideoMode] Container not found');
                return;
            }

            // Check if a button already exists and remove it
            const existingButton = container.querySelector('.yt-sub-btn');
            if (existingButton) {
                existingButton.remove();
            }

            this.downloadButton = UIComponents.createButton(
                'Download Subtitles',
                () => this.handleButtonClick()
            );

            container.appendChild(this.downloadButton);
            console.debug('[SingleVideoMode] Button added successfully');
        } catch (error) {
            console.error('[SingleVideoMode] Failed to add download button:', error);
        }
    }


    async handleButtonClick() {
        console.debug('[SingleVideoMode] Button clicked for video:', this.videoId);
        const loading = UIComponents.showLoading();

        try {
            // Always fetch fresh subtitle tracks when button is clicked
            this.subtitleTracks = await SubtitleProcessor.fetchSubtitleTracks(this.videoId);

            if (!this.subtitleTracks?.length) {
                UIComponents.showToast(CONFIG.MESSAGES.NO_SUBTITLE);
                return;
            }

            this.showSubtitleDialog();
        } catch (error) {
            UIComponents.showToast(CONFIG.MESSAGES.ERROR.FETCH);
            console.error('[SingleVideoMode] Failed to fetch subtitles:', error);
        } finally {
            UIComponents.removeLoading(loading);
        }
    }

    showSubtitleDialog() {
        const content = UIComponents.createSubtitleDialog(
            this.subtitleTracks,
            {
                onDownload: () => this.handleDownload(),
                onCopy: () => this.handleCopy()
            }
        );

        const dialog = UIComponents.createDialog({
            title: CONFIG.MESSAGES.HAVE_SUBTITLE,
            content,
            onClose: () => dialog.remove()
        });

        document.body.appendChild(dialog);
    }

    async handleDownload() {
        const tracks = this.getSelectedTracks();
        const format = this.getSelectedFormat();

        if (!tracks.length) {
            UIComponents.showToast('Please select at least one subtitle');
            return;
        }

        const loading = UIComponents.showLoading('Downloading subtitles...');

        try {
            for (const track of tracks) {
                const content = await SubtitleProcessor.getSubtitleContent(track, format);
                const filename = `${Utils.sanitizeFileName(document.title)}_${track.languageCode}.${format}`;
                SubtitleProcessor.downloadSubtitle(content, filename);
                await new Promise(resolve => setTimeout(resolve, CONFIG.TIMINGS.DOWNLOAD_DELAY));
            }
        } catch (error) {
            UIComponents.showToast(CONFIG.MESSAGES.ERROR.FETCH);
            console.error('Download error:', error);
        } finally {
            UIComponents.removeLoading(loading);
        }
    }

    async handleCopy() {
        const tracks = this.getSelectedTracks();
        const format = this.getSelectedFormat();

        if (!tracks.length) {
            UIComponents.showToast('Please select at least one subtitle');
            return;
        }

        const loading = UIComponents.showLoading('Copying subtitles...');

        try {
            let content = '';
            for (const track of tracks) {
                const subtitleContent = await SubtitleProcessor.getSubtitleContent(track, format);
                content += `=== ${track.languageName} ===\n${subtitleContent}\n\n`;
            }

            await SubtitleProcessor.copyToClipboard(content);
            UIComponents.showToast(CONFIG.MESSAGES.COPY_SUCCESS);
        } catch (error) {
            UIComponents.showToast(CONFIG.MESSAGES.ERROR.COPY);
            console.error('Copy error:', error);
        } finally {
            UIComponents.removeLoading(loading);
        }
    }

    getSelectedTracks() {
        const checkboxes = document.querySelectorAll('.yt-sub-track input:checked');
        return Array.from(checkboxes)
            .map(cb => this.subtitleTracks
                .find(track => track.languageCode === cb.value))
            .filter(Boolean);
    }

    getSelectedFormat() {
        return document.querySelector('input[name="format"]:checked').value;
    }

    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found`));
            }, timeout);
        });
    }

    cleanup() {
        console.debug('[SingleVideoMode] Cleaning up');
        if (this.downloadButton) {
            this.downloadButton.remove();
        }
        if (this.videoObserver) {
            this.videoObserver.disconnect();
        }
        this.videoId = null;
        this.subtitleTracks = null;
        this.currentVideoUrl = null;
    }
}


class BulkVideoMode {
    constructor() {
        this.selectedVideos = new Map();
        this.isProcessing = false;
        this.selectionControls = null;
        this.videoObserver = null;
        this.isSelectionMode = false;
        this.initialized = false;
        console.debug('[BulkVideoMode] Created new instance');
    }

    initialize() {
        if (this.initialized) {
            console.debug('[BulkVideoMode] Already initialized, skipping');
            return;
        }

        console.debug('[BulkVideoMode] Initializing');
        this.createControls();
        this.initialized = true;
    }

    createControls() {
        console.debug('[BulkVideoMode] Creating controls');
        // Create and add the initial "Select Videos" button
        const bulkButton = UIComponents.createButton(
            'Get Videos Sub',
            () => this.toggleSelectionMode(),
            'yt-sub-bulk-btn'
        );

        bulkButton.style.cssText = `
            position: fixed;
            right: 20px;
            top: 80px;
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        // Create select all control
        const selectAllContainer = document.createElement('div');
        selectAllContainer.style.cssText = `
            position: fixed;
            right: 20px;
            top: 130px;
            z-index: 9999;
            background: white;
            padding: 8px 16px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            display: none;
        `;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'select-all';
        checkbox.style.marginRight = '8px';
        checkbox.addEventListener('change', (e) => this.handleSelectAll(e.target.checked));

        const label = document.createElement('label');
        label.htmlFor = 'select-all';
        label.textContent = 'Select All';

        selectAllContainer.appendChild(checkbox);
        selectAllContainer.appendChild(label);

        this.selectionControls = {
            button: bulkButton,
            selectAllContainer: selectAllContainer
        };

        document.body.appendChild(bulkButton);
        document.body.appendChild(selectAllContainer);
    }

    toggleSelectionMode() {
        console.debug('[BulkVideoMode] Toggling selection mode. Current:', this.isSelectionMode);
        if (!this.isSelectionMode) {
            this.startSelection();
        } else {
            this.processSelected();
        }
    }

    startSelection() {
        if (this.isSelectionMode) {
            console.debug('[BulkVideoMode] Already in selection mode, skipping');
            return;
        }

        console.debug('[BulkVideoMode] Starting selection mode');
        this.isSelectionMode = true;
        this.selectionControls.button.textContent = "Download Subtitles";
        this.selectionControls.selectAllContainer.style.display = 'flex';
        this.setupVideoObserver();
        this.processVideoElements();
    }

    processSelected() {
        if (this.selectedVideos.size === 0) {
            UIComponents.showToast('Please select at least one video');
            return;
        }

        // Process videos
        this.processSelectedVideos();
    }

    handleSelectAll(checked) {
        if (this.isProcessing) return;

        const checkboxes = document.querySelectorAll('.yt-sub-checkbox');
        checkboxes.forEach(checkbox => {
            const videoElement = checkbox.closest(CONFIG.SELECTORS.VIDEO_ELEMENTS);
            if (videoElement) {
                const videoId = this.extractVideoId(videoElement);
                checkbox.checked = checked;

                if (checked && videoId) {
                    this.selectedVideos.set(videoId, {
                        title: this.extractVideoTitle(videoElement),
                        id: videoId
                    });
                } else if (!checked) {
                    this.selectedVideos.delete(videoId);
                }
            }
        });
    }

    updateButtonState() {
        if (!this.selectionControls?.button) return;

        const hasSelectedItems = this.selectedVideos.size > 0;

        if (this.isProcessing) {
            this.selectionControls.button.textContent = 'Processing...';
            this.selectionControls.button.disabled = true;
        } else if (hasSelectedItems) {
            this.selectionControls.button.textContent = 'Get Subtitles';
            this.selectionControls.button.disabled = false;
        } else {
            this.selectionControls.button.textContent = 'Select Videos Sub';
            this.selectionControls.button.disabled = false;
        }
    }

    setupVideoObserver() {
        console.debug('[BulkVideoMode] Setting up video observer');
        if (this.videoObserver) {
            console.debug('[BulkVideoMode] Disconnecting existing observer');
            this.videoObserver.disconnect();
        }

        this.videoObserver = new MutationObserver((mutations) => {
            const shouldProcess = mutations.some(mutation => {
                return Array.from(mutation.addedNodes).some(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const matches = node.matches?.(CONFIG.SELECTORS.VIDEO_ELEMENTS) ||
                            node.querySelector?.(CONFIG.SELECTORS.VIDEO_ELEMENTS);
                        if (matches) {
                            console.debug('[BulkVideoMode] New video element detected');
                        }
                        return matches;
                    }
                    return false;
                });
            });

            if (shouldProcess && this.isSelectionMode) {
                console.debug('[BulkVideoMode] Processing new video elements');
                this.processVideoElements();
            }
        });

        const targets = [
            document.querySelector('#content'),
            document.querySelector('ytd-watch-next-secondary-results-renderer'),
            document.querySelector('#related')
        ].filter(Boolean);

        targets.forEach(target => {
            if (target) {
                this.videoObserver.observe(target, {
                    childList: true,
                    subtree: true
                });
            }
        });

        if (this.isSelectionMode) {
            this.processVideoElements();
        }
        console.debug('[BulkVideoMode] Video observer setup complete');
    }

    processVideoElements() {
        console.debug('[BulkVideoMode] Processing video elements. Selection mode:', this.isSelectionMode);
        if (!this.isSelectionMode) {
            console.debug('[BulkVideoMode] Skipping processing - not in selection mode');
            return;
        }

        const selectors = [
            'ytd-video-renderer',
            'ytd-compact-video-renderer',
            '#dismissible'
        ].join(', ');

        const videoElements = document.querySelectorAll(selectors);
        console.debug(`[BulkVideoMode] Found ${videoElements.length} video elements`);
        videoElements.forEach(element => this.addCheckboxToVideo(element));
    }

    addCheckboxToVideo(element) {
        if (element.querySelector('.yt-sub-checkbox')) {
            console.debug('[BulkVideoMode] Checkbox already exists for element');
            return;
        }

        const videoId = this.extractVideoId(element);
        if (!videoId) {
            console.debug('[BulkVideoMode] No video ID found for element');
            return;
        }

        const container = element.querySelector('#dismissible') || element;
        if (!container) {
            console.debug('[BulkVideoMode] No container found for checkbox');
            return;
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'yt-sub-checkbox';

        const isCompact = element.tagName.toLowerCase() === 'ytd-compact-video-renderer';
        checkbox.style.cssText = `
            position: absolute;
            left: -25px;
            top: ${isCompact ? '5px' : '20px'};
            z-index: 9999;
            cursor: pointer;
            width: 20px;
            height: 20px;
        `;

        checkbox.addEventListener('change', (e) => {
            console.debug(`[BulkVideoMode] Checkbox changed for video ${videoId}:`, e.target.checked);
            if (e.target.checked) {
                this.selectedVideos.set(videoId, {
                    title: this.extractVideoTitle(element),
                    id: videoId
                });
            } else {
                this.selectedVideos.delete(videoId);
            }
            console.debug(`[BulkVideoMode] Selected videos count:`, this.selectedVideos.size);
        });

        if (container.style.position !== 'relative') {
            container.style.position = 'relative';
        }

        container.prepend(checkbox);
        console.debug('[BulkVideoMode] Added checkbox to video:', videoId);
    }

    async processSelectedVideos() {
        const loading = UIComponents.showLoading('Fetching subtitles...');

        try {
            await Promise.all(
                Array.from(this.selectedVideos.entries())
                    .map(async ([videoId, data]) => {
                        try {
                            const tracks = await SubtitleProcessor.fetchSubtitleTracks(videoId);
                            if (tracks) {
                                this.selectedVideos.set(videoId, {
                                    ...data,
                                    subtitles: tracks
                                });
                            }
                        } catch (error) {
                            console.error(`Failed to fetch subtitles for video ${videoId}:`, error);
                        }
                    })
            );

            this.showBulkSubtitleDialog();
        } catch (error) {
            UIComponents.showToast(CONFIG.MESSAGES.ERROR.FETCH);
            console.error('Failed to process videos:', error);
        } finally {
            UIComponents.removeLoading(loading);
        }
    }

    showBulkSubtitleDialog() {
        const content = document.createElement('div');
        content.appendChild(this.createFormatSelector());

        for (const [videoId, data] of this.selectedVideos) {
            content.appendChild(this.createVideoSection(videoId, data));
        }

        content.appendChild(this.createActionButtons());

        const dialog = UIComponents.createDialog({
            title: 'Select Subtitles to Download',
            content,
            onClose: () => {
                dialog.remove();
                this.cleanup();
                this.isSelectionMode = false;
            }
        });

        document.body.appendChild(dialog);
    }

    createFormatSelector() {
        const formatDiv = document.createElement('div');
        formatDiv.style.marginBottom = '20px';
        formatDiv.innerHTML = `
            <div style="margin-bottom: 15px;">
                <label style="margin-right: 10px;">
                    <input type="radio" name="format" value="srt" checked> SRT
                </label>
                <label>
                    <input type="radio" name="format" value="txt"> Plain Text
                </label>
            </div>
        `;
        return formatDiv;
    }

    createVideoSection(videoId, data) {
        const section = document.createElement('div');
        section.className = 'yt-sub-video-section';
        section.style.cssText = `
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        `;

        const title = document.createElement('h3');
        title.style.margin = '0 0 10px 0';
        title.textContent = data.title;
        section.appendChild(title);

        if (data.subtitles?.length) {
            data.subtitles.forEach(track => {
                const trackDiv = document.createElement('div');
                trackDiv.className = 'yt-sub-track';
                trackDiv.innerHTML = `
                    <label>
                        <input type="checkbox"
                               data-video-id="${videoId}"
                               data-lang="${track.languageCode}">
                        ${track.languageName}
                    </label>
                `;
                section.appendChild(trackDiv);
            });
        } else {
            const noSubs = document.createElement('p');
            noSubs.style.color = '#c00';
            noSubs.textContent = CONFIG.MESSAGES.NO_SUBTITLE;
            section.appendChild(noSubs);
        }

        return section;
    }

    createActionButtons() {
        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        `;

        actions.appendChild(UIComponents.createButton(
            'Download Selected',
            () => this.handleBulkDownload()
        ));
        actions.appendChild(UIComponents.createButton(
            'Copy Selected',
            () => this.handleBulkCopy()
        ));

        return actions;
    }

    async handleBulkDownload() {
        const tracks = this.getSelectedTracks();
        const format = document.querySelector('input[name="format"]:checked').value;

        if (!tracks.length) {
            UIComponents.showToast('Please select at least one subtitle');
            return;
        }

        const loading = UIComponents.showLoading('Downloading subtitles...');

        try {
            for (const track of tracks) {
                const video = this.selectedVideos.get(track.videoId);
                const subtitle = video.subtitles.find(s => s.languageCode === track.lang);

                if (subtitle) {
                    const content = await SubtitleProcessor.getSubtitleContent(subtitle, format);
                    const filename = `${Utils.sanitizeFileName(video.title)}_${subtitle.languageCode}.${format}`;
                    SubtitleProcessor.downloadSubtitle(content, filename);
                    await new Promise(resolve => setTimeout(resolve, CONFIG.TIMINGS.DOWNLOAD_DELAY));
                }
            }
        } catch (error) {
            UIComponents.showToast(CONFIG.MESSAGES.ERROR.FETCH);
            console.error('Bulk download error:', error);
        } finally {
            UIComponents.removeLoading(loading);
        }
    }

    async handleBulkCopy() {
        const tracks = this.getSelectedTracks();
        const format = document.querySelector('input[name="format"]:checked').value;

        if (!tracks.length) {
            UIComponents.showToast('Please select at least one subtitle');
            return;
        }

        const loading = UIComponents.showLoading('Copying subtitles...');

        try {
            let content = '';
            for (const track of tracks) {
                const video = this.selectedVideos.get(track.videoId);
                const subtitle = video.subtitles.find(s => s.languageCode === track.lang);

                if (subtitle) {
                    const subtitleContent = await SubtitleProcessor.getSubtitleContent(subtitle, format);
                    content += `=== ${video.title} - ${subtitle.languageName} ===\n${subtitleContent}\n\n`;
                }
            }

            await SubtitleProcessor.copyToClipboard(content);
            UIComponents.showToast(CONFIG.MESSAGES.COPY_SUCCESS);
        } catch (error) {
            UIComponents.showToast(CONFIG.MESSAGES.ERROR.COPY);
            console.error('Bulk copy error:', error);
        } finally {
            UIComponents.removeLoading(loading);
        }
    }

    getSelectedTracks() {
        return Array.from(document.querySelectorAll('.yt-sub-track input:checked'))
            .map(checkbox => ({
                videoId: checkbox.dataset.videoId,
                lang: checkbox.dataset.lang
            }));
    }

    extractVideoId(element) {
        const link = element.querySelector(CONFIG.SELECTORS.THUMBNAIL);
        if (!link?.href) return null;

        const url = new URL(link.href);
        return url.searchParams.get('v');
    }

    extractVideoTitle(element) {
        return element.querySelector(CONFIG.SELECTORS.VIDEO_TITLE)?.textContent?.trim() || 'Untitled Video';
    }

    cleanup(fullCleanup = false) {
        console.debug('[BulkVideoMode] Cleanup called. Full cleanup:', fullCleanup);

        if (this.isProcessing) {
            console.debug('[BulkVideoMode] Processing in progress, skipping cleanup');
            return;
        }

        // Always clean up observers to prevent memory leaks
        if (this.videoObserver) {
            console.debug('[BulkVideoMode] Disconnecting observer');
            this.videoObserver.disconnect();
            this.videoObserver = null;
        }

        // Reset UI state without removing elements
        if (this.selectionControls) {
            console.debug('[BulkVideoMode] Resetting UI state');
            this.selectionControls.button.textContent = 'Select Videos Sub';
            this.selectionControls.selectAllContainer.style.display = 'none';
            // Reset select all checkbox
            const selectAllCheckbox = document.getElementById('select-all');
            if (selectAllCheckbox) selectAllCheckbox.checked = false;
        }

        // Clean up video checkboxes
        document.querySelectorAll('.yt-sub-checkbox').forEach(cb => {
            const dismissible = cb.closest('#dismissible');
            if (dismissible) dismissible.style.position = '';
            cb.remove();
        });

        // Reset state
        this.selectedVideos.clear();
        this.isSelectionMode = false;

        // Only if we're completely removing the feature (like when uninstalling)
        if (fullCleanup && this.selectionControls) {
            console.debug('[BulkVideoMode] Performing full cleanup (uninstall)');
            this.selectionControls.button.remove();
            this.selectionControls.selectAllContainer.remove();
            this.selectionControls = null;
            this.initialized = false;
        }

        console.debug('[BulkVideoMode] Cleanup complete');
    }
}
    // Export to global scope
    Object.assign(window.YTSubtitles, {
        VideoManager,
        SingleVideoMode,
        BulkVideoMode
    });
})();

(function() {
    'use strict';

    // Initialize video manager
    window.YTSubtitles.activeManager = new window.YTSubtitles.VideoManager();
})();
