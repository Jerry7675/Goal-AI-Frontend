import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from "../supabaseClient";
 import { set } from 'react-hook-form'; // This import was unused and can be removed
import GeneratedRoutine from '../components/GeneratedRoutine'; // Assuming this component is also styled well


const Dashboard = () => {
  const [goal, setGoal] = useState("");
  const [routine, setRoutine] = useState(null);
  const [approved, setApproved] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false); // This state is not actively used in the provided logic for UI changes
  const [user, setUser] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Set to true initially for fetching profile

  const textareaRef = useRef(null);
  const socketRef = useRef(null); // Not used in the current fetch logic, kept as per original

  const navigate = useNavigate();

  useEffect(() => {
     setConnected(true); // This line is not needed if WebSocket is commented out
    const fetchProfile = async () => {
      setLoading(true); // Start loading

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        // No direct message/popup state in Dashboard, navigate directly
        console.error("User not authenticated:", userError);
        navigate("/login");
        setLoading(false);
        return;
      }

      setUser(user);

      // Returns gender and age from profiles table where id matches user.id
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("gender, age")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile data:", profileError);
        // Optionally set an error here if you want to display it
      }

      setProfile(profileData || null);
      setLoading(false); // End loading
    };
    fetchProfile();

    // fetchUserProfile is called on auth state change
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    // Cleanup listener on unmount
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]); // Add navigate to dependency array

  // WebSocket connection logic (commented out as per original)
  useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:8000/ws");
    socketRef.current.onopen = () => { setConnected(true); };
    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "routine") { setRoutine(message.data); }
      else if (message.type === "error") { setError(message.data); }
    };
    socketRef.current.onerror = (err) => { console.error("WebSocket error", err); setError("WebSocket error occurred."); };
    socketRef.current.onclose = () => { setConnected(false); console.warn("WebSocket connection closed."); };
    return () => socketRef.current?.close();
  }, []);


  const sendGoal = () => {
    // Original WebSocket logic commented out, using fetch as per original
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError("WebSocket not connected.");
      return;
    }
    const payload = { type: "goal", data: goal, };
    socketRef.current.send(JSON.stringify(payload));

    if (!user) {
      setError("Please log in to submit a goal.");
      return;
    }

    // Ensure profile data is available before sending
    if (!profile || profile.gender === null || profile.age === null) {
      setError("Please complete your profile (gender and age) in Account Settings before submitting a goal.");
      return;
    }

    console.log("Submit Goal button clicked");
    console.log(`Email: ${user.email}\nGender: ${profile.gender}\nAge: ${profile.age}\n`);

    setWaiting(true); // Indicate loading state for the button
    setError(null); // Clear previous errors

    const message = textareaRef.current.value.trim();

    if (!message) {
      setError("Please enter your goal.");
      setWaiting(false);
      return;
    }

    fetch("http://127.0.0.1:8000/generate-routine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        goal: message,
        email: user.email, // Use actual user email
        gender: profile.gender, // Pass gender from profile
        age: profile.age,     // Pass age from profile
      }),
    })
      .then((res) => {
        if (!res.ok) {
          // Handle HTTP errors
          return res.json().then(err => { throw new Error(err.detail || 'Failed to generate routine'); });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Response from server:", data);
        if (data.routine) {
          setRoutineWithNotify(data.routine);
          setError(null);
        } else {
          setError("No routine generated. Please try a different goal.");
        }
      })
      .catch((err) => {
        setError(`Failed to generate routine: ${err.message || err}`);
        console.error("Fetch error:", err);
      })
      .finally(() => {
        setWaiting(false); // End loading state regardless of success or failure
      });
  };

  const setRoutineWithNotify = (routineData) => {
    if (Array.isArray(routineData)) {
      setRoutine(routineData.map(item => ({ ...item, notify: false })));
    } else {
      setRoutine(routineData); // Keep original behavior for non-array routines
    }
  };

  // Show a loading spinner while profile is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-500 mb-6"></div>
        <p className="text-xl text-gray-300">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-gray-800 shadow-2xl rounded-3xl p-8 sm:p-10 w-full max-w-3xl border border-gray-700">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8 text-gray-100 leading-tight">
          AI Goal Planner
        </h1>
        <p className="text-lg text-center mb-10 text-gray-400">
          Describe your fitness or health goal, and our AI will generate a personalized routine for you.
        </p>

        <div className="mb-6">
          <textarea
            className="w-full p-4 sm:p-5 border border-gray-600 rounded-xl mb-4 text-lg text-gray-100 bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out resize-y min-h-[120px]"
            ref={textareaRef}
            placeholder="E.g., I want to run a marathon in 6 months, I need a 30-day weight loss plan, or I want to build muscle mass and strength."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={5} // Set initial rows for better appearance
          />
        </div>

        <button
          className={`w-full py-4 rounded-xl text-xl font-bold transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg ${
            waiting
              ? "bg-blue-700 cursor-not-allowed opacity-70"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
          onClick={sendGoal}
          disabled={waiting || !user || !profile || profile.gender === null || profile.age === null}
        >
          {waiting ? "Generating Routine..." : "Generate Routine"}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-800 text-white rounded-lg flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-lg font-medium">{error}</p>
          </div>
        )}

        {routine && (
          <div className="mt-10 pt-8 border-t border-gray-700">
            <GeneratedRoutine routineState={[routine, setRoutine]} approvedState={[approved, setApproved]} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;