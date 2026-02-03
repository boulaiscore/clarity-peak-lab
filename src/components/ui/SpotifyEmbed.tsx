/**
 * Spotify Embed Player
 * 
 * Embeds a Spotify show player that allows users to preview podcasts
 * Non-premium users get 30-second previews, premium users get full playback
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpotifyEmbedProps {
  spotifyShowId: string;
  className?: string;
  height?: number;
}

export function SpotifyEmbed({ 
  spotifyShowId, 
  className,
  height = 152 
}: SpotifyEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  const embedUrl = `https://open.spotify.com/embed/show/${spotifyShowId}?utm_source=generator&theme=0`;
  
  return (
    <div className={cn("relative w-full rounded-xl overflow-hidden bg-muted/30", className)}>
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-muted/50"
          style={{ height }}
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      />
    </div>
  );
}
