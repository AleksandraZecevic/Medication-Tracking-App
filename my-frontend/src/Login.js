import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://88.200.63.148:2004";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // login or signup
  const [formData, setFormData] = useState({
    user_id: "",
    name: "",
    lastname: "",
    email: "",
    password: "",
    role: "user",
    language_pref: "en",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "signup") {
      fetch(`${API_URL}/user/nextid`)
        .then((res) => res.json())
        .then((data) => {
          setFormData((f) => ({ ...f, user_id: data.nextId.toString() }));
        })
        .catch((err) => console.error("Failed to fetch next user_id:", err));
    } else {
      setFormData((f) => ({ ...f, user_id: "" }));
    }
  }, [mode]);

  const handleChange = (e) => {
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleLogin = async () => {
    setErrorMsg("");
    const { email, password } = formData;
    if (!email || !password) {
      setErrorMsg("Please enter email and password");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.error || "Login failed");
        return;
      }
      const user = await res.json();
      if (user.role === "user") {
        onLogin(user);
        navigate("/userhome");  // normal user home
      } else if (user.role === "healthcare_worker") {
        onLogin(user);
        navigate("/healthcare");  // healthcare worker home
      }else if (user.role === "caregiver"){
        onLogin(user);
        navigate("/caregiver"); 
      } else if(user.role === "donation_center"){
        onLogin(user);
        navigate("/donationcenter"); 
      }else{
        setErrorMsg("You got something wrong");  
      }
    } catch (err) {
      setErrorMsg("Network error: " + err.message);
    }
  };

  const handleSignUp = async () => {
    setErrorMsg("");
    const { user_id, name, lastname, email, password, role, language_pref } = formData;

    if (!user_id || isNaN(user_id)) {
      setErrorMsg("User ID must be a valid number");
      return;
    }
    if (!name || !lastname || !email || !password) {
      setErrorMsg("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(user_id),
          name,
          lastname,
          email,
          password,
          role,
          language_pref,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.error || "Sign up failed");
        return;
      }

      alert("Sign up successful! Please log in.");
      setMode("login");
      setFormData({
        user_id: "",
        name: "",
        lastname: "",
        email: "",
        password: "",
        role: "user",
        language_pref: "en",
      });
    } catch (err) {
      setErrorMsg("Network error: " + err.message);
    }
  };

  return (
    <div className="page">
      <h1 className="title">Med-Track</h1>
      <p className="slogan">track your medication, help yourself and others</p>
      <div className="form-container">
        {mode === "login" ? (
          <>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
              className="input"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              className="input"
            />
            <button onClick={handleLogin} className="button primary">
              Log In
            </button>
            <p>
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                }}
                className="link-button"
              >
                Sign Up
              </button>
            </p>
          </>
        ) : (
          <>
            <input
              type="number"
              name="user_id"
              placeholder="User ID (number)"
              value={formData.user_id}
              onChange={handleChange}
              className="input"
              readOnly
            />
            <input
              type="text"
              name="name"
              placeholder="First Name"
              value={formData.name}
              onChange={handleChange}
              className="input"
            />
            <input
              type="text"
              name="lastname"
              placeholder="Last Name"
              value={formData.lastname}
              onChange={handleChange}
              className="input"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
              className="input"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              className="input"
            />
            <label>
              Role:{" "}
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input"
              >
                <option value="user">User</option>
                <option value="caregiver">Caregiver</option>
                <option value="healthcare_worker">Healthcare Worker</option>
                <option value="donation_center">Donation Center</option>
              </select>
            </label>
            <label>
              Language Preference:{" "}
              <select
                name="language_pref"
                value={formData.language_pref}
                onChange={handleChange}
                className="input"
              >
                <option value="en">English</option>
                <option value="en">No more options for now</option>
              </select>
            </label>
            <button onClick={handleSignUp} className="button primary">
              Create Account
            </button>
            <p>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                }}
                className="link-button"
              >
                Log In
              </button>
            </p>
          </>
        )}
        {errorMsg && <p className="error">{errorMsg}</p>}
      </div>
    </div>
  );
}
