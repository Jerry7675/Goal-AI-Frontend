import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../supabaseClient";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const redirectUrl = "http://localhost:5173/";

  const onSubmit = async (data) => {
    setMessage("");
    setError("");

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (signInError) {
      setError("Failed to send login link. Please try again.");
      console.error("Magic link error:", signInError);
    } else {
      setMessage(`A magic login link has been sent to your email (${data.email}). Please check your inbox.`);
    }
  };

  const handleGoogleLogin = async () => {
    setMessage("");
    setError("");

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (oauthError) {
      setError("Google login failed. Please try again.");
      console.error("Google OAuth error:", oauthError);
    }
  };

  return (
    // Outer container for centering and background
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Login form container */}
      <div className="max-w-md w-full bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl relative border border-gray-700">
        {/* Close button */}
        <a
          href="/"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 text-3xl font-bold transition-colors duration-200 ease-in-out"
          aria-label="Close"
        >
          &times;
        </a>

        {/* Title */}
        <h1 className="text-white text-center text-4xl font-extrabold mb-8">
          Login / Sign Up
        </h1>

        {/* Email Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-white text-base font-medium mb-2 block">
              Email Address
            </label>
            <input
              id="email" // Added id for accessibility with label
              name="email"
              type="email"
              {...register("email", { required: "Email is required" })}
              className="w-full text-gray-100 text-lg border border-gray-600 bg-gray-700 px-4 py-3 rounded-lg outline-none transition-all duration-200 ease-in-out placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com" // Improved placeholder
              aria-invalid={errors.email ? "true" : "false"} // ARIA for validation
            />
            {errors.email && (
              <p role="alert" className="text-red-400 text-sm mt-2">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Messages */}
          {message && (
            <p className="text-green-400 text-sm text-center py-3 px-4 bg-green-900 bg-opacity-30 rounded-lg border border-green-700">
              {message}
            </p>
          )}
          {error && (
            <p className="text-red-400 text-sm text-center py-3 px-4 bg-red-900 bg-opacity-30 rounded-lg border border-red-700">
              {error}
            </p>
          )}

          {/* Continue with Email Button */}
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Continue with Email
          </button>

          {/* OR Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-600" />
            <span className="mx-4 text-gray-400 font-medium">OR</span>
            <div className="flex-grow border-t border-gray-600" />
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center border border-gray-600 bg-gray-700 text-white rounded-lg py-3 hover:bg-purple-600 transition-colors duration-200 ease-in-out shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google logo"
              className="w-6 h-6 mr-3"
            />
            <span className="font-medium">Continue with Google</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;