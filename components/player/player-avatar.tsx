"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useObjectUrl } from "@/hooks/use-object-url";
import { initials } from "@/lib/utils";

interface PlayerAvatarProps {
  name: string;
  avatar?: Blob;
  className?: string;
}

export function PlayerAvatar({ name, avatar, className }: PlayerAvatarProps) {
  const url = useObjectUrl(avatar);

  return (
    <Avatar className={className}>
      {url && <AvatarImage src={url} alt={name} />}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
