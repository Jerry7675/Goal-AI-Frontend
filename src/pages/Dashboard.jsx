import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from "../supabaseClient";
import { set } from 'react-hook-form';
import GeneratedRoutine from '../components/GeneratedRoutine';


const Dashboard = () => {
  const [goal, setGoal] = useState("");
  const [routine, setRoutine] = useState(null);
  const [approved, setApproved] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const textareaRef = useRef(null);
  const socketRef = useRef(null);

  const navigate = useNavigate();

    useEffect(() => {
        setConnected(true);
        const fetchProfile = async () => {
            setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                setMessage("User not authenticated");
                setShowPopup(true);
                navigate("/login");
                return;
            }

            setUser(user);

            // Returns display_name and avatar_url from profiles table where id matches user.id
            const { data: profileData } = await supabase
                .from("profiles")
                .select("gender, age")
                .eq("id", user.id)
                .maybeSingle();

            setProfile(profileData || null);
        };
        fetchProfile();

        // fetchUserProfile is called on auth state change
        const { data: listener } = supabase.auth.onAuthStateChange(() => {
            fetchProfile();
        });
    }, []);

  // useEffect(() => {
  //   // Connect to WebSocket server
  //   socketRef.current = new WebSocket("ws://localhost:8000/ws");

  //   socketRef.current.onopen = () => {
  //     setConnected(true);
  //   };

  //   socketRef.current.onmessage = (event) => {
  //     const message = JSON.parse(event.data);
  //     if (message.type === "routine") {
  //       setRoutine(message.data);
  //     } else if (message.type === "error") {
  //       setError(message.data);
  //     }
  //   };

  //   socketRef.current.onerror = (err) => {
  //     console.error("WebSocket error", err);
  //     setError("WebSocket error occurred.");
  //   };

  //   socketRef.current.onclose = () => {
  //     setConnected(false);
  //     console.warn("WebSocket connection closed.");
  //   };

  //   return () => socketRef.current?.close();
  // }, []);


  const sendGoal = () => {
  //   if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
  //     setError("WebSocket not connected.");
  //     return;
  // }
  //   const payload = {
  //     type: "goal",
  //     data: goal,
  //   };
  //   socketRef.current.send(JSON.stringify(payload));
    console.log("button clicked");
    console.log(`Email: ${user.email}\nGender: ${profile.gender}\nAge: ${profile.age}\n` );
    setWaiting(true);

    const message = textareaRef.current.value;
    fetch("http://127.0.0.1:8000/generate-routine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ goal: message, email: user.email ? user.email : "britantshrestha@gmail.com" }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Response from server:", data);
        if (data.routine) {
          setRoutineWithNotify(data.routine);
          setError(null);
        } else {
          setError("No routine generated.");
        }
      })
      .catch((err) => {
        setError("Failed to generate routine.");
        console.error(err);
      });
    setWaiting(false);
  };

  

  const setRoutineWithNotify = (routineData) => {
    if (Array.isArray(routineData)) {
      setRoutine(routineData.map(item => ({ ...item, notify: false })));
    } else {
      setRoutine(routineData);
    }
  };

  

  return (

    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Goal-Based AI Planner
        </h1>

        <textarea
          className="w-full p-4 border rounded-lg mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          ref={textareaRef}
          placeholder="Enter your goal (e.g., I want 6 pack abs)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-lg font-semibold transition"
          onClick={sendGoal}
        //   disabled={!connected}
          disabled={waiting}
        >
          {waiting ? "Submitting..." : "Submit Goal"}
        </button>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        {routine && (<GeneratedRoutine routineState={[routine, setRoutine]} approvedState={[approved, setApproved]} />)}
      </div>
    </div>
  );
}

export default Dashboard