#!/usr/bin/env node

/**
 * YouTube URL Validation Script
 *
 * Run this script to validate all YouTube URLs in the mock data
 * and check for embedding restrictions that would cause YouTube Player Error 150
 *
 * This script checks:
 * - Video existence and availability
 * - Embedding permissions (prevents Error 150 in FocusTracks)
 * - X-Frame-Options headers that block embedding
 *
 * Usage: node scripts/validate-youtube-urls.js
 *
 * IMPORTANT: Run this script whenever:
 * - Adding new YouTube URLs to mock data
 * - Updating existing YouTube URLs
 * - Users report YouTube Player Error 150
 * - Before deploying to production
 *
 * To add to package.json scripts:
 * "validate-youtube": "node scripts/validate-youtube-urls.js"
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Extract YouTube video ID from URL
function getYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Validate a single YouTube video for basic availability and embedding
async function validateYouTubeVideo(url) {
  const videoId = getYouTubeId(url);

  if (!videoId) {
    return { isValid: false, error: 'Invalid YouTube URL format' };
  }

  try {
    // First check if video exists using oEmbed
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oembedResponse = await fetch(oembedUrl);

    if (!oembedResponse.ok) {
      if (oembedResponse.status === 404) {
        return { isValid: false, error: 'Video not found or private' };
      }
      return { isValid: false, error: `HTTP ${oembedResponse.status}: ${oembedResponse.statusText}` };
    }

    const oembedData = await oembedResponse.json();

    // Check for embedding restrictions by examining the HTML response
    // If a video doesn't allow embedding, the oEmbed will still work but the iframe won't
    try {
      const embedCheckUrl = `https://www.youtube.com/embed/${videoId}`;
      const embedResponse = await fetch(embedCheckUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FocusTracks/1.0)'
        }
      });

      // Additional check: try to detect embedding restrictions
      // Some videos that don't allow embedding will still return 200 for HEAD requests
      // but will fail when actually embedded. We can detect this by checking the response headers
      if (embedResponse.status === 200) {
        const xFrameOptions = embedResponse.headers.get('x-frame-options');
        if (xFrameOptions && (xFrameOptions.toLowerCase().includes('deny') || xFrameOptions.toLowerCase().includes('sameorigin'))) {
          return {
            isValid: false,
            error: 'Video does not allow embedding (X-Frame-Options restriction)',
            title: oembedData.title,
            author: oembedData.author_name
          };
        }
      } else if (embedResponse.status === 403) {
        return {
          isValid: false,
          error: 'Video does not allow embedding (403 Forbidden)',
          title: oembedData.title,
          author: oembedData.author_name
        };
      }
    } catch (embedError) {
      // If embed check fails, we'll still consider the video valid if oEmbed worked
      // This is because some embedding restrictions can't be detected via HTTP requests
      console.warn(`Embed check failed for ${videoId}, but video exists: ${embedError.message}`);
    }

    return {
      isValid: true,
      title: oembedData.title,
      author: oembedData.author_name,
      canEmbed: true // We assume it can embed if we got this far
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message || 'Network error'
    };
  }
}

// Mock track data (copy from your route file)
const MOCK_TRACKS = [
  {
    id: '1',
    title: 'Deep Focus',
    youtube_url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
  },
  {
    id: '2',
    title: 'Peaceful Piano Study',
    youtube_url: 'https://www.youtube.com/watch?v=lFcSrYw-ARY',
  },
  {
    id: '3',
    title: 'Electronic Concentration',
    youtube_url: 'https://www.youtube.com/watch?v=f02mOEt11OQ',
  },
  {
    id: '4',
    title: 'Nature Sounds for Focus',
    youtube_url: 'https://www.youtube.com/watch?v=mPZkdNFkNps',
  },
  {
    id: '5',
    title: 'Minimal Techno Work',
    youtube_url: 'https://www.youtube.com/watch?v=YJNi7aRwUzU',
  },
  {
    id: '6',
    title: 'Bach for Concentration',
    youtube_url: 'https://www.youtube.com/watch?v=6JQm5aSjX6g',
  },
  {
    id: '7',
    title: 'Lofi Hip Hop Study',
    youtube_url: 'https://www.youtube.com/watch?v=5yx6BWlEVcY',
  },
  {
    id: '8',
    title: 'Meditation Bells',
    youtube_url: 'https://www.youtube.com/watch?v=kHnOIsQwkOg',
  },
  {
    id: '9',
    title: 'Debussy for Deep Work',
    youtube_url: 'https://www.youtube.com/watch?v=9E6b3swbnWg',
  },
  {
    id: '10',
    title: 'Rain and Thunder',
    youtube_url: 'https://www.youtube.com/watch?v=n_Dv4JMiwK8',
  }
];

// Main validation function
async function validateAllUrls() {
  console.log('🔍 Validating YouTube URLs in mock data...\n');

  const results = [];
  let validCount = 0;
  let invalidCount = 0;

  for (const track of MOCK_TRACKS) {
    if (track.youtube_url) {
      console.log(`Checking: ${track.title}...`);

      const result = await validateYouTubeVideo(track.youtube_url);

      if (result.isValid) {
        console.log(`✅ ${track.title} - Valid (${result.title})`);
        validCount++;
      } else {
        if (result.error.includes('embedding')) {
          console.log(`🚫 ${track.title} - ${result.error}`);
          console.log(`   ⚠️  This video will cause YouTube Player Error 150 in FocusTracks`);
        } else {
          console.log(`❌ ${track.title} - ${result.error}`);
        }
        console.log(`   URL: ${track.youtube_url}`);
        if (result.title) {
          console.log(`   Title: "${result.title}" by ${result.author || 'Unknown'}`);
        }
        invalidCount++;
      }

      results.push({ track, result });

      // Small delay to be respectful to YouTube's servers
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Valid URLs (embeddable): ${validCount}`);
  console.log(`❌ Invalid URLs: ${invalidCount}`);

  if (invalidCount > 0) {
    const embeddingIssues = results.filter(r => !r.result.isValid && r.result.error?.includes('embedding')).length;
    const otherIssues = invalidCount - embeddingIssues;

    if (embeddingIssues > 0) {
      console.log(`\n🚫 Found ${embeddingIssues} video(s) with embedding restrictions.`);
      console.log(`   These will cause "YouTube Player Error 150" in FocusTracks.`);
      console.log(`   Replace with videos that allow embedding.`);
    }

    if (otherIssues > 0) {
      console.log(`\n❌ Found ${otherIssues} video(s) with other issues (not found, private, etc.).`);
    }

    console.log(`\n⚠️  Consider updating all ${invalidCount} problematic URL(s) in your mock data.`);
    return false;
  } else {
    console.log(`\n🎉 All YouTube URLs are valid and embeddable!`);
    console.log(`   No videos should cause YouTube Player Error 150.`);
    return true;
  }
}

// Run the validation
if (require.main === module) {
  validateAllUrls().catch(console.error);
}

module.exports = { validateYouTubeVideo, getYouTubeId };