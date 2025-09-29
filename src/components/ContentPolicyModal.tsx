'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'

export default function ContentPolicyModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-1">
          <Info className="h-3 w-3" />
          <span>Content Policy</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <DialogHeader>
          <DialogTitle>FocusTracks Content Policy</DialogTitle>
          <DialogDescription>
            Guidelines for submitting tracks to our focus music library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-3 text-green-700">✅ Acceptable Content</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Focus & Productivity Music</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Instrumental tracks designed for concentration</li>
                  <li>Classical music (public domain preferred)</li>
                  <li>Ambient and atmospheric soundscapes</li>
                  <li>Lo-fi hip hop and chill beats</li>
                  <li>Nature sounds and white noise</li>
                  <li>Minimal techno and electronic focus music</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Content Guidelines</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li><strong>Instrumental preferred:</strong> Tracks with minimal or no vocals to avoid distraction</li>
                  <li><strong>Appropriate length:</strong> 10+ minutes preferred for extended focus sessions</li>
                  <li><strong>Calm dynamics:</strong> Non-jarring volume changes and peaceful transitions</li>
                  <li><strong>Family-friendly:</strong> No explicit content or inappropriate themes</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3 text-blue-700">🔗 Platform Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">YouTube Compliance</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Only submit videos that are <strong>publicly available</strong></li>
                  <li>Avoid content with active copyright disputes</li>
                  <li>Focus on channels that allow embedding</li>
                  <li>Prefer <strong>Creative Commons</strong> licensed content</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Spotify Compliance</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Only link to <strong>officially released</strong> tracks</li>
                  <li>Verify tracks are available in major regions</li>
                  <li>Avoid bootlegs or user-uploaded content</li>
                  <li>Ensure tracks are properly licensed</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3 text-red-700">❌ Prohibited Content</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Copyright Issues</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Copyrighted music without clear licensing</li>
                  <li>Unofficial uploads or &quot;bootleg&quot; versions</li>
                  <li>Content with active copyright disputes</li>
                  <li>Remix or cover versions without proper rights</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Inappropriate Content</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Explicit lyrics or themes</li>
                  <li>Distracting or high-energy music unsuitable for focus</li>
                  <li>Content promoting harmful activities</li>
                  <li>Spam or duplicate submissions</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Platform Violations</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Private or restricted YouTube videos</li>
                  <li>Broken or region-locked links</li>
                  <li>Content that violates platform terms of service</li>
                  <li>Links to non-music content</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3 text-purple-700 dark:text-purple-300">🔄 Submission Process</h3>
            <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-md p-4">
              <ol className="list-decimal list-inside text-sm space-y-2">
                <li><strong>Submit your track</strong> with complete information and valid URLs</li>
                <li><strong>Admin review</strong> - Our team checks content policy compliance</li>
                <li><strong>URL verification</strong> - We test that links work and content is accessible</li>
                <li><strong>Content assessment</strong> - We evaluate if the track suits focus/productivity</li>
                <li><strong>Decision</strong> - Track is approved, rejected, or requires modifications</li>
                <li><strong>Publication</strong> - Approved tracks are added to the FocusTracks library</li>
              </ol>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3 text-yellow-700 dark:text-yellow-300">⚠️ Important Notes</h3>
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
              <ul className="list-disc list-inside text-sm space-y-2">
                <li><strong>Quality over quantity:</strong> We prefer fewer high-quality submissions</li>
                <li><strong>Respect copyright:</strong> When in doubt, don&apos;t submit copyrighted content</li>
                <li><strong>Focus-first:</strong> Ask yourself: &quot;Would this help me concentrate?&quot;</li>
                <li><strong>Be patient:</strong> Review process may take 1-3 business days</li>
                <li><strong>Community benefit:</strong> Consider how your submission helps other users</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">Examples of Great Submissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <h4 className="font-medium text-green-800 mb-1">✅ Good Example</h4>
                <p className="text-green-700">
                  <strong>Title:</strong> &quot;Rain Sounds for Deep Focus&quot;<br/>
                  <strong>Artist:</strong> &quot;Nature Sounds Co&quot;<br/>
                  <strong>Duration:</strong> 45 minutes<br/>
                  <strong>Description:</strong> &quot;Gentle rain sounds perfect for studying and concentration. No music, just pure nature audio.&quot;
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <h4 className="font-medium text-red-800 mb-1">❌ Poor Example</h4>
                <p className="text-red-700">
                  <strong>Title:</strong> &quot;Epic Gaming Music Mix&quot;<br/>
                  <strong>Artist:</strong> &quot;Random User&quot;<br/>
                  <strong>Duration:</strong> 3 minutes<br/>
                  <strong>Description:</strong> &quot;Cool music&quot;
                </p>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}