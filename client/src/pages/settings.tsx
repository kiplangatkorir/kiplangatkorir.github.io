import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/ImageUpload";

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await updateProfile({
        name: formData.get('name') as string,
        bio: formData.get('bio') as string,
      });
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = (url: string) => {
    updateProfile({ avatarUrl: url });
  };

  if (!user) {
    return <div>Please log in to access settings</div>;
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
        <div className="flex items-center gap-4">
          <ImageUpload
            onUploadComplete={handleAvatarUpload}
            className="w-32"
          />
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover"
            />
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={user.name}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={user.bio}
            placeholder="Tell us about yourself"
            rows={4}
          />
        </div>

        <Button type="submit">Save Changes</Button>
      </form>
    </div>
  );
}
