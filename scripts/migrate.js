#!/usr/bin/env node

/**
 * Database Migration Runner for FocusTracks
 *
 * This script replaces the manual SQL files and provides:
 * - Automated migration execution
 * - Migration tracking
 * - Data repair functions
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@supabase/supabase-js')
// const fs = require('fs') // Unused import
// const path = require('path') // Unused import

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\n💡 Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file')
  process.exit(1)
}

// Create admin client with service role for bypassing RLS
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// const migrationsDir = path.join(__dirname, '..', 'migrations') // Unused variable

/**
 * Repair data inconsistencies (replaces manual SQL scripts)
 */
async function repairData() {
  console.log('🔧 Starting data repair...\n')

  try {
    // 1. Fix orphaned submissions (replaces publish-orphaned-submissions.sql)
    console.log('🔄 Publishing orphaned approved submissions...')

    // First, find orphaned submissions
    const { data: orphanedSubmissions, error: findError } = await supabase
      .from('track_submissions')
      .select(`
        id, title, artist, genre, duration,
        youtube_url, spotify_url, description, updated_at
      `)
      .eq('status', 'approved')

    if (findError) {
      console.error(`❌ Failed to find orphaned submissions: ${findError.message}`)
      return false
    }

    if (!orphanedSubmissions || orphanedSubmissions.length === 0) {
      console.log('✨ No orphaned submissions found')
    } else {
      console.log(`📋 Found ${orphanedSubmissions.length} approved submissions to check`)

      // Check which ones don't have corresponding tracks
      const orphaned = []
      for (const submission of orphanedSubmissions) {
        const { data: existingTrack } = await supabase
          .from('tracks')
          .select('id')
          .eq('title', submission.title)
          .eq('artist', submission.artist)
          .single()

        if (!existingTrack) {
          orphaned.push(submission)
        }
      }

      if (orphaned.length > 0) {
        console.log(`🔄 Publishing ${orphaned.length} orphaned submissions as tracks...`)

        for (const submission of orphaned) {
          const trackData = {
            title: submission.title,
            artist: submission.artist,
            genre: submission.genre,
            duration: submission.duration,
            youtube_url: submission.youtube_url,
            spotify_url: submission.spotify_url,
            audio_url: submission.youtube_url || submission.spotify_url,
            created_at: new Date().toISOString()
          }

          const { error: insertError } = await supabase
            .from('tracks')
            .insert([trackData])

          if (insertError) {
            console.error(`❌ Failed to create track for "${submission.title}": ${insertError.message}`)
          } else {
            console.log(`✅ Created track: ${submission.title} by ${submission.artist}`)
          }
        }
      } else {
        console.log('✨ All approved submissions already have corresponding tracks')
      }
    }

    // 2. Normalize URL fields (replaces update-tracks.sql functionality)
    console.log('\n🔄 Normalizing URL fields...')

    const { data: tracksToFix, error: urlError } = await supabase
      .from('tracks')
      .select('id, audio_url, youtube_url, spotify_url')
      .or('youtube_url.is.null,spotify_url.is.null')
      .not('audio_url', 'is', null)

    if (urlError) {
      console.error(`❌ Failed to fetch tracks for URL normalization: ${urlError.message}`)
      return false
    }

    if (tracksToFix && tracksToFix.length > 0) {
      for (const track of tracksToFix) {
        const updates = {}

        // Determine YouTube URL
        if (!track.youtube_url && track.audio_url) {
          if (track.audio_url.includes('youtube.com') || track.audio_url.includes('youtu.be')) {
            updates.youtube_url = track.audio_url
          }
        }

        // Determine Spotify URL
        if (!track.spotify_url && track.audio_url) {
          if (track.audio_url.includes('spotify.com')) {
            updates.spotify_url = track.audio_url
          }
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('tracks')
            .update(updates)
            .eq('id', track.id)

          if (updateError) {
            console.error(`❌ Failed to update track ${track.id}: ${updateError.message}`)
          } else {
            console.log(`✅ Updated URLs for track ${track.id}`)
          }
        }
      }
    } else {
      console.log('✨ All tracks have properly normalized URL fields')
    }

    // 3. Ensure audio_url consistency
    console.log('\n🔄 Ensuring audio_url consistency...')

    const { data: tracksWithoutAudioUrl } = await supabase
      .from('tracks')
      .select('id, youtube_url, spotify_url, audio_url')
      .is('audio_url', null)

    if (tracksWithoutAudioUrl && tracksWithoutAudioUrl.length > 0) {
      for (const track of tracksWithoutAudioUrl) {
        const audioUrl = track.youtube_url || track.spotify_url

        if (audioUrl) {
          const { error } = await supabase
            .from('tracks')
            .update({ audio_url: audioUrl })
            .eq('id', track.id)

          if (!error) {
            console.log(`✅ Set audio_url for track ${track.id}`)
          }
        }
      }
    }

    console.log('\n🎉 Data repair completed successfully!')
    return true

  } catch (error) {
    console.error(`💥 Data repair failed: ${error.message}`)
    return false
  }
}

/**
 * Show database status and health
 */
async function showStatus() {
  console.log('📊 Database Status\n')

  try {
    // Count records in main tables
    const { count: tracksCount } = await supabase
      .from('tracks')
      .select('*', { count: 'exact', head: true })

    const { count: submissionsCount } = await supabase
      .from('track_submissions')
      .select('*', { count: 'exact', head: true })

    const { count: playlistsCount } = await supabase
      .from('playlists')
      .select('*', { count: 'exact', head: true })

    console.log(`📀 Tracks: ${tracksCount || 0}`)
    console.log(`📝 Submissions: ${submissionsCount || 0}`)
    console.log(`🎵 Playlists: ${playlistsCount || 0}`)

    // Check for data issues
    console.log('\n🔍 Data Health Check:')

    // Check for tracks without audio URLs
    const { count: tracksWithoutAudio } = await supabase
      .from('tracks')
      .select('*', { count: 'exact', head: true })
      .is('audio_url', null)

    if (tracksWithoutAudio > 0) {
      console.log(`⚠️  ${tracksWithoutAudio} tracks missing audio_url`)
    } else {
      console.log('✅ All tracks have audio URLs')
    }

    // Check for orphaned submissions
    const { data: approvedSubmissions } = await supabase
      .from('track_submissions')
      .select('title, artist')
      .eq('status', 'approved')

    if (approvedSubmissions && approvedSubmissions.length > 0) {
      let orphanedCount = 0
      for (const submission of approvedSubmissions) {
        const { data: existingTrack } = await supabase
          .from('tracks')
          .select('id')
          .eq('title', submission.title)
          .eq('artist', submission.artist)
          .single()

        if (!existingTrack) {
          orphanedCount++
        }
      }

      if (orphanedCount > 0) {
        console.log(`⚠️  ${orphanedCount} approved submissions not published as tracks`)
      } else {
        console.log('✅ All approved submissions are published')
      }
    }

  } catch (error) {
    console.error(`❌ Failed to fetch status: ${error.message}`)
  }
}

/**
 * Validate environment and database connection
 */
async function validateEnvironment() {
  console.log('🔍 Validating environment...\n')

  // Check environment variables
  console.log('Environment Variables:')
  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '***' + supabaseUrl.slice(-10) : '❌ Missing'}`)
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '***' + serviceRoleKey.slice(-10) : '❌ Missing'}`)

  // Test database connection
  console.log('\nDatabase Connection:')
  try {
    const { error } = await supabase.from('tracks').select('count(*)', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ Database connection failed: ${error.message}`)
      return false
    } else {
      console.log('✅ Database connection successful')
      return true
    }
  } catch (error) {
    console.log(`❌ Database connection error: ${error.message}`)
    return false
  }
}

// CLI Interface
const command = process.argv[2]

async function main() {
  try {
    switch (command) {
      case 'repair':
        await repairData()
        break

      case 'status':
        await showStatus()
        break

      case 'validate':
        await validateEnvironment()
        break

      default:
        console.log('🗃️  FocusTracks Database Tool\n')
        console.log('Usage:')
        console.log('  npm run data:repair   Fix data inconsistencies')
        console.log('  npm run data:status   Show database status')
        console.log('  npm run data:validate Validate environment')
        console.log('')
        console.log('Environment variables required:')
        console.log('  - NEXT_PUBLIC_SUPABASE_URL')
        console.log('  - SUPABASE_SERVICE_ROLE_KEY')
        break
    }
  } catch (error) {
    console.error(`💥 Database tool failed: ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}