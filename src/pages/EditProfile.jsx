import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  User,
  Mail,
  Globe,
  Calendar,
  VenusAndMars,
  Check,
  XCircle, // Added for error messages
} from "lucide-react";

const EditProfile = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    email: "",
    gender: "",
    age: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [showPopup, setShowPopup] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("User not authenticated. Please log in.");
        setMessageType("error");
        setShowPopup(true);
        setLoading(false);
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `display_name, bio, email, gender, age, avatar_url`
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setMessage("Failed to fetch profile.");
        setMessageType("error");
        setShowPopup(true);
      }

      if (data) {
        setFormData({
          display_name: data.display_name || "",
          bio: data.bio || "",
          email: data.email || user.email || "", // Use user.email if profile email is missing
          gender: data.gender || "",
          age: data.age || "",
        });
        setProfilePic(data.avatar_url || null);
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  // Removed validateUrl as it was not being used in the provided logic for form validation

  const updateProfile = async () => {
    if (!user) {
      setMessage("User not authenticated.");
      setMessageType("error");
      setShowPopup(true);
      return;
    }

    // Basic validation for display name
    if (!formData.display_name.trim()) {
      setMessage("Display Name is required.");
      setMessageType("error");
      setShowPopup(true);
      return;
    }

    setLoading(true);

    // Check for display name uniqueness before updating
    const { data: existing, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("display_name", formData.display_name.trim())
      .neq("id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking display_name uniqueness:", checkError);
      setMessage("Error validating display name uniqueness.");
      setMessageType("error");
      setShowPopup(true);
      setLoading(false);
      return;
    }
    if (existing) {
      setMessage("Display Name already exists. Please choose another.");
      setMessageType("error");
      setShowPopup(true);
      setLoading(false);
      return;
    }

    // No `hasError` logic was present in the original code, so keeping it as is.
    // If you plan to add more client-side validation, this section would be expanded.
    // let hasError = false;
    // const newErrors = { ...errors };
    // setErrors(newErrors);
    // if (hasError) {
    //   setMessage("Please fix the errors before saving.");
    //   setMessageType("error");
    //   setShowPopup(true);
    //   setLoading(false);
    //   return;
    // }

    const updates = {
      id: user.id,
      display_name: formData.display_name.trim(),
      bio: formData.bio,
      // email: formData.email, // Email should generally not be updated this way via profiles table
      gender: formData.gender,
      age: formData.age,
      avatar_url: profilePic, // This is updated separately via handleUpload
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(updates);

    if (error) {
      if (
        error.message &&
        error.message.includes(
          'duplicate key value violates unique constraint "profiles_display_name_key"'
        )
      ) {
        setMessage("Display Name already exists.");
      } else {
        setMessage(`Failed to update profile: ${error.message}`);
      }
      setMessageType("error");
      setShowPopup(true);
    } else {
      setMessage("Profile updated successfully!");
      setMessageType("success");
      setShowPopup(true);
    }
    setLoading(false);

    // Auto-hide popup after 3 seconds
    setTimeout(() => setShowPopup(false), 3000);
  };

  const handleUpload = async (e) => {
    if (!user) {
      setMessage("User not authenticated.");
      setMessageType("error");
      setShowPopup(true);
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    setLoading(true); // Show loading while uploading

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Upload failed:", uploadError.message);
      setMessage(`Failed to upload avatar: ${uploadError.message}`);
      setMessageType("error");
      setShowPopup(true);
      setLoading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`; // Add timestamp to bust cache

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (error) {
      setMessage(`Avatar URL update failed: ${error.message}`);
      setMessageType("error");
      setShowPopup(true);
    } else {
      setProfilePic(publicUrl);
      setMessage("Profile picture updated successfully!");
      setMessageType("success");
      setShowPopup(true);
    }

    setLoading(false);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear specific error if user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (loading && !user) { // Only show full loading screen if user data is not yet fetched
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <h2 className="text-4xl font-bold mb-2 text-center text-gray-100">
          Account Settings
        </h2>
        <p className="mb-8 text-center text-xl text-gray-400">
          Manage your account.
        </p>
        <div className="max-w-3xl w-full mx-auto p-10 bg-gray-800 text-white rounded-xl shadow-lg border border-gray-700 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-6"></div>
          <div className="text-lg text-gray-300">Fetching profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 bg-gray-900 text-white">
      {/* Page Title and Subtitle */}
      <h2 className="text-5xl font-extrabold mb-4 text-center text-gray-100">
        Account Settings
      </h2>
      <p className="mb-10 text-center text-xl text-gray-400">
        Manage your profile information and preferences.
      </p>

      {/* Main Profile Card */}
      <div className="max-w-4xl w-full mx-auto p-8 sm:p-10 bg-gray-800 text-white rounded-2xl shadow-2xl border border-gray-700">
        {/* Profile Picture Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-gray-700">
          <div className="w-28 h-28 rounded-full overflow-hidden flex-shrink-0 border-4 border-blue-500 shadow-lg">
            {profilePic ? (
              <img
                src={profilePic}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400">
                <svg className="h-20 w-20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="text-2xl font-bold text-gray-100 mb-2">Profile Avatar</h3>
            <label
              htmlFor="profile-picture-upload"
              className="inline-flex items-center bg-blue-600 text-white px-5 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors duration-200 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Upload New Picture
              <input
                id="profile-picture-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={loading}
              />
            </label>
            {loading && (
              <p className="text-gray-400 text-sm mt-2 flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-blue-400 mr-2"></span>
                Uploading...
              </p>
            )}
          </div>
        </div>

        {/* Profile Information Fields */}
        <div className="space-y-6">
          <InputField
            label="Display Name"
            name="display_name"
            value={formData.display_name}
            onChange={handleChange}
            icon={<User size={20} />}
            error={errors.display_name}
            placeholder="Your public name"
            required // Indicate required field
          />
          <InputField
            label="Email Address"
            name="email"
            value={formData.email}
            onChange={() => {}} // Read-only field
            readOnly
            icon={<Mail size={20} />}
            placeholder="Your email address"
          />
          <TextAreaField
            label="Bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us a little about yourself (e.g., interests, profession)"
          />
          <InputField
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            placeholder="Male, Female, Non-binary, etc."
            icon={<VenusAndMars size={20} />}
            error={errors.gender}
          />
          <InputField
            label="Age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Your age"
            icon={<Calendar size={20} />}
            error={errors.age}
            type="number" // Suggest number input for age
          />
        </div>

        {/* Update Profile Button */}
        <button
          onClick={updateProfile}
          className="mt-10 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          disabled={loading}
        >
          {loading ? "Saving Profile..." : "Update Profile"}
        </button>
      </div>

      {/* Popup Message */}
      {showPopup && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 z-50 transition-all duration-300 ease-out transform ${
            messageType === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
          role="alert"
        >
          {messageType === "success" ? (
            <Check className="w-6 h-6" />
          ) : (
            <XCircle className="w-6 h-6" />
          )}
          <span className="text-lg font-medium">{message}</span>
        </div>
      )}
    </div>
  );
};

// Reusable Input Field Component
const InputField = ({
  label,
  name,
  value,
  onChange,
  readOnly = false,
  placeholder = "",
  icon,
  error,
  type = "text", // Added type prop
  required = false, // Added required prop
}) => (
  <div>
    <label htmlFor={name} className="block mb-2 text-lg text-gray-300 font-medium">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <div
      className={`flex items-center bg-gray-700 border border-gray-600 rounded-xl px-5 py-3 transition-all duration-200 ease-in-out ${
        readOnly ? "opacity-70" : "focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
      }`}
    >
      {icon && <span className="mr-4 text-gray-400 text-xl">{icon}</span>}
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`flex-1 bg-transparent outline-none text-white placeholder:text-gray-400 text-lg ${
          readOnly ? "cursor-not-allowed" : ""
        }`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : undefined}
      />
    </div>
    {error && (
      <div id={`${name}-error`} className="text-red-400 text-sm mt-2" role="alert">
        {error}
      </div>
    )}
  </div>
);

// Reusable Text Area Field Component
const TextAreaField = ({ label, name, value, onChange, placeholder = "" }) => (
  <div>
    <label htmlFor={name} className="block mb-2 text-lg text-gray-300 font-medium">
      {label}
    </label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      rows={4} // Increased rows for more space
      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 text-lg transition-all duration-200 ease-in-out"
      placeholder={placeholder}
    />
  </div>
);

export default EditProfile;