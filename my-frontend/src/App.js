import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import UserHome from "./userPage/UserHome";
import HwHome from "./hwPage/HwHome";
import CgHome from "./cgPage/CgHome";
import DcHome from "./dcPage/DcHome";
import Login from "./Login";

export default function App() {
  const [loggedInUser, setLoggedInUser] = React.useState(null);

  return (
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
      <Route
        path="/healthcare"
        element={
          loggedInUser && loggedInUser.role === "healthcare_worker" ? (
            <HwHome hw={loggedInUser} onLogout={() => setLoggedInUser(null)} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
       <Route
        path="/caregiver"
        element={
          loggedInUser && loggedInUser.role === "caregiver" ? (
            <CgHome cg={loggedInUser} onLogout={() => setLoggedInUser(null)} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/donationcenter"
        element={
          loggedInUser && loggedInUser.role === "donation_center" ? (
            <DcHome dc={loggedInUser} onLogout={() => setLoggedInUser(null)} />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
