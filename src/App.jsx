// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import ChatPage from "./pages/ChatPage.jsx";
// import IdentifYouLanding from "./pages/LandingPage.jsx";
// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient.js";
// import { Auth } from "@supabase/auth-ui-react";
// import { ThemeSupa } from '@supabase/auth-ui-shared'

// function App() {
//   const [session, setSession] = useState(null);

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//     });
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//     });
//     return () => subscription.unsubscribe();
//   }, []);

//   if (!session) {
//     return <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />;
//   } else {
//     return <div>Logged in!</div>;
//   }
//   // return (
//   //   <div>
//   //     <Router>
//   //       <Routes>
//   //         <Route path="/" element={<IdentifYouLanding />} />
//   //         <Route path="/chat" element={<ChatPage />} />
//   //       </Routes>
//   //     </Router>
//   //   </div>
//   // );
// }

// export default App;

import "./index.css";
import { useState, useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

import { supabase } from "./utils/supabaseClient";
export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  console.log(session);
  console.log(session?.user?.email);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.log("Error signing out:", error.message);
  };

  const signUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.log("Error signing in:", error.message);
  };

  if (!session) {
    return (
      <>
        {/* <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} /> */}
        <button className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer" onClick={signUp}>Sign in with Google</button>
      </>
    );
  } else {
    return (
      <div>
        <h2>Welcome, {session?.user?.email}</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={signOut}>Sign Out</button>
      </div>
    );
  }
}
