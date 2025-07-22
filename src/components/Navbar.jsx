import { useEffect, useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null); // Ref for the dropdown menu

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let polling;

    const fetchUserProfile = async () => {
      setLoading(true); // Start loading

      // Fetch user profile with auth
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      // if no user set all states to null and return
      if (error || !user) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        // navigate("/login"); // Only navigate if explicitly needed, otherwise let routing handle it
        return;
      }

      // If user exists
      setUser(user);

      // Returns display_name and avatar_url from profiles table where id matches user.id
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile data:", profileError);
      }

      setProfile(profileData || null);
      setLoading(false); // End loading
    };

    fetchUserProfile();

    // fetchUserProfile is called on auth state change
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUserProfile();
    });

    // Data updates in 1 seconds of saving (polling)
    polling = setInterval(fetchUserProfile, 1000);

    // Stops memory leaks by unsubscribing from the listener and clearing the interval
    return () => {
      listener?.subscription.unsubscribe();
      clearInterval(polling);
    };
  }, []); // No need for navigate in dependency array here, as it's stable

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setMenuOpen(false); // Close menu on logout
    navigate("/login");
  };

  const avatarUrl = profile?.avatar_url;
  const displayName = profile?.display_name || user?.email || "User";

  if (loading) {
    return (
      <nav className="bg-gray-900 text-white sticky top-0 z-50 border-b border-gray-700 shadow-lg">
        <div className="max-w-screen-xl flex justify-between items-center mx-auto p-4">
          <NavLink
            to="/"
            className="flex items-center space-x-2 sm:space-x-3"
            aria-label="Go to Home"
          >
            <img
              src="/vite.svg" // Assuming this is your logo path
              className="h-8 sm:h-10"
              alt="GoalAI Logo"
            />
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-400">
              GoalAI
            </span>
          </NavLink>
          {/* Loading state for user actions */}
          <div className="flex items-center space-x-4">
            <div className="animate-pulse bg-gray-700 rounded-full h-10 w-10"></div>
            <div className="animate-pulse bg-gray-700 rounded-lg h-10 w-24"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 border-b border-gray-700 shadow-lg">
      <div className="max-w-screen-xl flex justify-between items-center mx-auto p-4 sm:p-6">
        {/* Logo and App Name */}
        <NavLink
          to="/"
          className="flex items-center space-x-2 sm:space-x-3 transition-transform duration-200 hover:scale-105"
          aria-label="Go to Home"
        >
          <img
            src="/logo.svg" // Assuming this is your logo path
            className="h-8 sm:h-10"
            alt="GoalAI Logo"
          />
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-400">
            GoalAI
          </span>
        </NavLink>

        {/* User Actions / Login Button */}
        <div className="relative" ref={menuRef}>
          {!user ? (
            <NavLink
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base sm:text-lg rounded-lg px-4 py-2 transition-colors duration-200 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Login / Sign Up
            </NavLink>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 text-base rounded-full bg-gray-800 hover:bg-gray-700 text-gray-100 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-md"
                aria-haspopup="true"
                aria-expanded={menuOpen ? "true" : "false"}
                aria-label="User menu"
              >
                {/* User Avatar */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="User Avatar"
                    className="w-9 h-9 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center border-2 border-blue-500">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 18c0-2.21 3.582-4 8-4s8 1.79 8 4v2H4v-2z" />
                    </svg>
                  </div>
                )}
                {/* Display Name */}
                <span className="font-medium whitespace-nowrap hidden sm:inline">
                  {displayName}
                </span>
                {/* Dropdown Arrow */}
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-gray-700 text-gray-100 rounded-lg shadow-xl z-50 overflow-hidden border border-gray-600 animate-fade-in-down">
                  <NavLink
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center px-4 py-3 hover:bg-gray-600 transition-colors duration-200 text-lg"
                    aria-label="Go to Home page"
                  >
                    {/* Home SVG Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="mr-3 h-6 w-6 text-gray-300"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 12l9-9 9 9M4.5 10.5V21a1.5 1.5 0 001.5 1.5h3.75a.75.75 0 00.75-.75v-4.5a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v4.5a.75.75 0 00.75.75H18a1.5 1.5 0 001.5-1.5V10.5"
                      />
                    </svg>
                    Home
                  </NavLink>

                  <NavLink
                    to="/edit-profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center px-4 py-3 hover:bg-gray-600 transition-colors duration-200 text-lg"
                    aria-label="Go to Edit Profile page"
                  >
                    {/* Settings SVG Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                      data-slot="icon"
                      className="mr-3 h-6 w-6 text-gray-300"
                    >
                      <path d="M17.004 10.407c.138.435-.216.842-.672.842h-3.465a.75.75 0 0 1-.65-.375l-1.732-3c-.229-.396-.053-.907.393-1.004a5.252 5.252 0 0 1 6.126 3.537ZM8.12 8.464c.307-.338.838-.235 1.066.16l1.732 3a.75.75 0 0 1 0 .75l-1.732 3c-.229.397-.76.5-1.067.161A5.23 5.23 0 0 1 6.75 12a5.23 5.23 0 0 1 1.37-3.536ZM10.878 17.13c-.447-.098-.623-.608-.394-1.004l1.733-3.002a.75.75 0 0 1 .65-.375h3.465c.457 0 .81.407.672.842a5.252 5.252 0 0 1-6.126 3.539Z"></path>
                      <path
                        fillRule="evenodd"
                        d="M21 12.75a.75.75 0 1 0 0-1.5h-.783a8.22 8.22 0 0 0-.237-1.357l.734-.267a.75.75 0 1 0-.513-1.41l-.735.268a8.24 8.24 0 0 0-.689-1.192l.6-.503a.75.75 0 1 0-.964-1.149l-.6.504a8.3 8.3 0 0 0-1.054-.885l.391-.678a.75.75 0 1 0-1.299-.75l-.39.676a8.188 8.188 0 0 0-1.295-.47l.136-.77a.75.75 0 0 0-1.477-.26l-.136.77a8.36 8.36 0 0 0-1.377 0l-.136-.77a.75.75 0 1 0-1.477.26l.136.77c-.448.121-.88.28-1.294.47l-.39-.676a.75.75 0 0 0-1.3.75l.392.678a8.29 8.29 0 0 0-1.054.885l-.6-.504a.75.75 0 1 0-.965 1.149l.6.503a8.243 8.243 0 0 0-.689 1.192L3.8 8.216a.75.75 0 1 0-.513 1.41l.735.267a8.222 8.222 0 0 0-.238 1.356h-.783a.75.75 0 0 0 0 1.5h.783c.042.464.122.917.238 1.356l-.735.268a.75.75 0 0 0 .513 1.41l.735-.268c.197.417.428.816.69 1.191l-.6.504a.75.75 0 0 0 .963 1.15l.601-.505c.326.323.679.62 1.054.885l-.392.68a.75.75 0 0 0 1.3.75l.39-.679c.414.192.847.35 1.294.471l-.136.77a.75.75 0 0 0 1.477.261l.137-.772a8.332 8.332 0 0 0 1.376 0l.136.772a.75.75 0 1 0 1.477-.26l-.136-.771a8.19 8.19 0 0 0 1.294-.47l.391.677a.75.75 0 0 0 1.3-.75l-.393-.679a8.29 8.29 0 0 0 1.054-.885l.601.504a.75.75 0 0 0 .964-1.15l-.6-.503c.261-.375.492-.774.69-1.191l.735.267a.75.75 0 1 0 .512-1.41l-.734-.267c.115-.439.195-.892.237-1.356h.784Zm-2.657-3.06a6.744 6.744 0 0 0-1.19-2.053 6.784 6.784 0 0 0-1.82-1.51A6.705 6.705 0 0 0 12 5.25a6.8 6.8 0 0 0-1.225.11 6.7 6.7 0 0 0-2.15.793 6.784 6.784 0 0 0-2.952 3.489.76.76 0 0 1-.036.098A6.74 6.74 0 0 0 5.251 12a6.74 6.74 0 0 0 3.366 5.842l.009.005a6.704 6.704 0 0 0 2.18.798l.022.003a6.792 6.792 0 0 0 2.368-.004 6.704 6.704 0 0 0 2.205-.811 6.785 6.785 0 0 0 1.762-1.484l.009-.01.009-.01a6.743 6.743 0 0 0 1.18-2.066c.253-.707.39-1.469.39-2.263a6.74 6.74 0 0 0-.408-2.309Z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    Edit Profile
                  </NavLink>

                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-3 hover:bg-gray-600 transition-colors duration-200 w-full text-left text-lg"
                    aria-label="Log out"
                  >
                    {/* Logout SVG Icon */}
                    <svg
                      className="mr-3 h-6 w-6 text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M16.5 3.75a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5V15a.75.75 0 0 0-1.5 0v3.75a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5.25a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3V9A.75.75 0 1 0 9 9V5.25a1.5 1.5 0 0 1 1.5-1.5h6ZM5.78 8.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 0 0 0 1.06l3 3a.75.75 0 0 0 1.06-1.06L5.06 13H15a.75.75 0 0 0 0-1.5H5.06l.72-.72a.75.75 0 0 0 0-1.06Z"
                      />
                    </svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;