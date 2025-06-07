import { type NextPage } from "next";
import Head from "next/head";
import { UserProfileForm } from "~/components/UserProfileForm";
import { useState } from "react"; // For success message

const ProfilePage: NextPage = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleProfileUpdateSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000); // Hide message after 3 seconds
  };

  return (
    <>
      <Head>
        <title>Your Profile - Taskify</title>
        <meta
          name="description"
          content="Manage your personal profile on Taskify"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-4xl font-extrabold text-gray-800">
          User Profile
        </h1>

        <div className="mx-auto max-w-lg">
          <UserProfileForm onSuccess={handleProfileUpdateSuccess} />
          {showSuccessMessage && (
            <div className="mt-4 rounded-md bg-green-100 p-3 text-center text-green-700">
              Profile updated successfully!
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
