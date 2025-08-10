import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import UserHome from "./userPage/UserHome";
import Login from "./Login";

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login onLogin={setLoggedInUser} />} />
        <Route
          path="/userhome"
          element={
            loggedInUser && loggedInUser.role === "user" ? (
              <UserHome user={loggedInUser} onLogout={() => setLoggedInUser(null)} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
