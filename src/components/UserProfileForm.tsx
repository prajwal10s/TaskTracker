// src/components/UserProfileForm.tsx
import React, { useState, useEffect } from "react";
import { api } from "~/utils/api"; // Assuming your tRPC client setup
import { useSession } from "next-auth/react";

// --- Mock/Assumed tRPC Types (ensure these match your actual tRPC types) ---
interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  // Add other profile fields you want to manage (e.g., bio, preferences)
  bio?: string | null;
}
// -------------------------------------------------------------------------

interface UserProfileFormProps {
  onSuccess: () => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  onSuccess,
}) => {
  const { data: session } = useSession();
  const userId = session?.user?.id; // Get the current user's ID

  // Fetch current user profile using api.user.getProfile
  const {
    data: userProfile,
    isLoading,
    isError,
    error,
    refetch,
  } = api.user.getProfile.useQuery(
    undefined, // No input needed for getProfile if it fetches the current user
    {
      enabled: !!userId, // Only run the query if userId is available
    },
  );

  const [name, setName] = useState(userProfile?.name || "");
  const [email, setEmail] = useState(userProfile?.email || "");

  // Update form state when userProfile data changes
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setEmail(userProfile.email || "");
    }
  }, [userProfile]);

  // Use api.user.updateProfile for the mutation
  const updateUserProfileMutation = api.user.updateProfile.useMutation({
    onSuccess: () => {
      void refetch(); // Refetch the profile to ensure data is updated
      onSuccess(); // Notify parent of success
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      console.error("User not authenticated or ID not found.");
      return;
    }

    try {
      await updateUserProfileMutation.mutateAsync({
        // Note: The `updateProfile` router procedure in your backend doesn't expect `id`
        // as it uses `ctx.session.user.id` from the context.
        // It also only expects `name` based on your provided router.
        // If you want to update bio, you'll need to add it to your `updateProfile` router input.
        name: name || undefined,
        // email: email || undefined, // Email is disabled in the form and often not updatable via frontend
        // bio: bio || undefined, // You need to add `bio: z.string().optional()` to your router's input
      });
    } catch (err) {
      console.error("Failed to update profile:", err);
      // Display error to user
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-600">Loading profile...</div>;
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">
        Error loading profile: {error.message}
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center text-gray-600">No profile data found.</div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Your Profile</h2>

      <div className="mb-4">
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          disabled // Email often disabled if managed by auth provider (e.g., NextAuth)
        />
        {/* You might add a note here if email is not editable */}
        <p className="mt-1 text-xs text-gray-500">
          Email is usually managed by your authentication provider.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={updateUserProfileMutation.isPending}
        >
          {updateUserProfileMutation.isPending ? "Saving..." : "Save Profile"}
        </button>
      </div>
      {updateUserProfileMutation.isError && (
        <p className="mt-4 text-sm text-red-500">
          Error updating profile: {updateUserProfileMutation.error?.message}
        </p>
      )}
      {updateUserProfileMutation.isSuccess && (
        <p className="mt-4 text-sm text-green-600">
          Profile updated successfully!
        </p>
      )}
    </form>
  );
};
