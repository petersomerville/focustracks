#!/usr/bin/env node

/**
 * YouTube URL Validation Script
 *
 * Run this script to validate all YouTube URLs in the mock data
 * Usage: node scripts/validate-youtube-urls.js
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Extract YouTube video ID from URL
function getYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Validate a single YouTube video
async function validateYouTubeVideo(url) {
  const videoId = getYouTubeId(url);

  if (!videoId) {
    return { isValid: false, error: 'Invalid YouTube URL format' };
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

    const response = await fetch(oembedUrl);

    if (!response.ok) {
      if (response.status === 404) {
        return { isValid: false, error: 'Video not found or private' };
      }
      return { isValid: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    return {
      isValid: true,
      title: data.title,
      author: data.author_name
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
    youtube_url: 'https://www.youtube.com/watch?v=jEy6MGu-N3o',
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
    youtube_url: 'https://www.youtube.com/watch?v=IP7zOBrpBzI',
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
        console.log(`❌ ${track.title} - ${result.error}`);
        console.log(`   URL: ${track.youtube_url}`);
        invalidCount++;
      }

      results.push({ track, result });

      // Small delay to be respectful to YouTube's servers
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Valid URLs: ${validCount}`);
  console.log(`❌ Invalid URLs: ${invalidCount}`);

  if (invalidCount > 0) {
    console.log(`\n⚠️  Found ${invalidCount} invalid URL(s). Consider updating them in your mock data.`);
    return false;
  } else {
    console.log(`\n🎉 All YouTube URLs are valid!`);
    return true;
  }
}

// Run the validation
if (require.main === module) {
  validateAllUrls().catch(console.error);
}

module.exports = { validateYouTubeVideo, getYouTubeId };