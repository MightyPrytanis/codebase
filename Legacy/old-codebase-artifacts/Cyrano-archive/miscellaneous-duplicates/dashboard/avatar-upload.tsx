import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, User } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  attorneyName: string;
  attorneyId: string;
}

export function AvatarUpload({ currentAvatarUrl, attorneyName, attorneyId }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateAvatar = useMutation({
    mutationFn: async (avatarUrl: string) => {
      const response = await fetch(`/api/attorneys/${attorneyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePhotoUrl: avatarUrl }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attorneys"] });
      toast({
        title: "Avatar Updated",
        description: "Your profile photo has been updated successfully.",
      });
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Get upload URL
      const uploadResponse = await fetch("/api/objects/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const { uploadURL } = await uploadResponse.json();

      // Upload file
      const uploadFileResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadFileResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Extract the object path from the upload URL
      const url = new URL(uploadURL);
      const objectPath = `/objects${url.pathname.split('/').slice(-2).join('/')}`;

      // Update attorney profile
      updateAvatar.mutate(objectPath);

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-gold">Profile Photo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="w-20 h-20">
            <AvatarImage 
              src={currentAvatarUrl} 
              alt={attorneyName}
              className="object-cover"
            />
            <AvatarFallback className="bg-gold text-slate-900 text-lg font-semibold">
              {getInitials(attorneyName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <p className="text-white font-medium">{attorneyName}</p>
            <p className="text-slate-400 text-sm">
              Upload a professional photo for your profile
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <label className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading || updateAvatar.isPending}
            />
            <Button
              asChild
              disabled={uploading || updateAvatar.isPending}
              className="w-full bg-gold hover:bg-gold/90 text-slate-900 cursor-pointer"
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Photo"}
              </span>
            </Button>
          </label>
          
          {currentAvatarUrl && (
            <Button
              variant="outline"
              onClick={() => updateAvatar.mutate("")}
              disabled={uploading || updateAvatar.isPending}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <User className="w-4 h-4 mr-2" />
              Use Initials
            </Button>
          )}
        </div>

        <div className="bg-slate-700 p-3 rounded-lg">
          <p className="text-slate-300 text-sm">
            <strong>Requirements:</strong> JPG, PNG, or GIF. Max size 5MB. 
            Recommended dimensions: 400x400 pixels.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}