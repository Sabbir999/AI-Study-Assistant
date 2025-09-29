// import React, { useState, useEffect, useContext } from "react";
// import { auth, storage } from "../config/firebase";
// import {
//   sendEmailVerification,
//   updateProfile,
//   updateEmail,
//   updatePassword,
//   reauthenticateWithCredential,
//   EmailAuthProvider,
//   deleteUser,
// } from "firebase/auth";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { useNavigate } from "react-router-dom";
// import { 
//   FaEye, 
//   FaEyeSlash, 
//   FaUser, 
//   FaTrashAlt, 
//   FaLock, 
//   FaTimes,
//   FaCreditCard
// } from "react-icons/fa";
// import { BsCloudUpload, BsCheck2 } from "react-icons/bs";
// import { ProfilePictureNameChange } from "./ProfilePictureNameChange";
// import "./Settings.css";

// function Settings() {
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const [isPopUp, setPopUp] = useState(false);
//   const [isDeletePopUp, setIsDeletePopUp] = useState(false);
//   const [settingsItem, setSettingsItem] = useState("");
//   const [newValue, setNewValue] = useState("");
//   const [passwordConfirm, setPasswordConfirm] = useState("");
//   const [passwordVisible, setPasswordVisible] = useState(false);
//   const [newPasswordVisible, setNewPasswordVisible] = useState(false);
//   const [isConfirmPopUp, setIsConfirmPopUp] = useState(false);
//   const [message, setMessage] = useState("");
//   const [isReauthenticated, setIsReauthenticated] = useState(false);
//   const [isMessageSuccess, setIsMessageSuccess] = useState(false);

//   const { userData, setUserData, profilePicture, setProfilePicture } =
//     useContext(ProfilePictureNameChange);

//   const [signupPasswordRequirements, setSignupPasswordRequirements] = useState({
//     length: false,
//     uppercase: false,
//     number: false,
//     specialcharacters: false,
//   });

//   // Validate password requirements
//   const validatePassword = (password) => {
//     const lengthRequirement = password.length >= 8;
//     const uppercaseRegex = /[A-Z]/;
//     const numberRegex = /[0-9]/;
//     const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

//     setSignupPasswordRequirements({
//       length: lengthRequirement,
//       uppercase: uppercaseRegex.test(password),
//       number: numberRegex.test(password),
//       specialcharacters: specialCharRegex.test(password),
//     });
//   };

//   // Email validation with domain check
//   const validateEmail = (email) => {
//     const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//     const allowedDomains = [
//       "gmail.com",
//       "outlook.com",
//       "yahoo.com",
//       "hotmail.com",
//       "icloud.com",
//     ];

//     if (!emailRegex.test(email)) {
//       return false;
//     }

//     const domain = email.split("@")[1];
//     if (!allowedDomains.includes(domain)) {
//       return false;
//     }

//     return true;
//   };

//   // Initialize user data when component mounts
//   useEffect(() => {
//     if (user) {
//       setUserData({ name: user.displayName, email: user.email });
//       setProfilePicture(user.photoURL || null);
//     }
//   }, [user]);

//   // Clear messages after timeout
//   useEffect(() => {
//     if (message) {
//       const timer = setTimeout(() => setMessage(""), 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [message]);

//   // Handle profile picture upload
//   const handleImageChange = async (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       try {
//         const storageRef = ref(storage, `profilePictures/${user.uid}`);
//         await uploadBytes(storageRef, file);
        
//         const downloadURL = await getDownloadURL(storageRef);
//         await updateProfile(user, { photoURL: downloadURL });
        
//         setProfilePicture(downloadURL);
//         setMessage("Profile picture updated successfully!");
//         setIsMessageSuccess(true);
//       } catch (error) {
//         setMessage(`Error uploading image: ${error.message}`);
//         setIsMessageSuccess(false);
//       }
//     } else {
//       setMessage("No file selected.");
//       setIsMessageSuccess(false);
//     }
//   };

//   // Get user initials for avatar placeholder
//   const getInitials = (name) => {
//     if (!name) return "";
//     const names = name.split(" ");
//     let initials = names[0].substring(0, 1).toUpperCase();
//     if (names.length > 1) {
//       initials += names[names.length - 1].substring(0, 1).toUpperCase();
//     }
//     return initials;
//   };

//   // Open popup for settings change
//   const handleOpenPopUp = (field) => {
//     setSettingsItem(field);
//     setNewValue("");
//     setMessage("");
//     setIsMessageSuccess(false);
    
//     if (["Delete Account", "Email Address", "Password"].includes(field)) {
//       setIsConfirmPopUp(true);
//       setIsReauthenticated(false);
//     } else {
//       setPopUp(true);
//     }
//   };

//   // Navigate to payment history
//   const handlePaymentHistory = () => {
//     navigate('/payment-history');
//   };

//   // Cancel popup
//   const handleCancel = () => {
//     setPopUp(false);
//     setIsConfirmPopUp(false);
//     setIsDeletePopUp(false);
//     setNewValue("");
//   };

//   // Confirm user password for sensitive operations
//   const handleConfirmPassword = async () => {
//     try {
//       if (!passwordConfirm) {
//         setMessage("Please enter your current password.");
//         setIsMessageSuccess(false);
//         return;
//       }

//       const credential = EmailAuthProvider.credential(
//         auth.currentUser.email,
//         passwordConfirm
//       );
//       await reauthenticateWithCredential(auth.currentUser, credential);
      
//       setIsReauthenticated(true);
//       setIsConfirmPopUp(false);
//       setPasswordConfirm("");

//       if (settingsItem === "Delete Account") {
//         setIsDeletePopUp(true);
//       } else {
//         setPopUp(true);
//       }
//     } catch (error) {
//       setMessage("Incorrect password. Please try again.");
//       setIsMessageSuccess(false);
//     }
//   };

//   // Save changes
//   const handleSave = async () => {
//     try {
//       if (settingsItem === "Name") {
//         await updateProfile(user, { displayName: newValue });
//         setUserData((prev) => ({ ...prev, name: newValue }));
//         setMessage("Name has been changed successfully.");
//         setIsMessageSuccess(true);
//       } else if (settingsItem === "Email Address") {
//         if (!isReauthenticated) {
//           setMessage("Please confirm your password before proceeding.");
//           setIsMessageSuccess(false);
//           return;
//         }

//         if (!validateEmail(newValue)) {
//           setMessage(
//             "Please enter a valid email address with a supported domain."
//           );
//           setIsMessageSuccess(false);
//           return;
//         }

//         if (!user.emailVerified) {
//           setMessage(
//             "Please verify your current email address. A verification email has been sent."
//           );
//           setIsMessageSuccess(false);
//           await sendEmailVerification(user);
//           return;
//         }

//         await updateEmail(user, newValue);
//         setMessage("Email updated! Please log in again.");
//         setIsMessageSuccess(true);
//         setTimeout(() => {
//           auth.signOut();
//           navigate("/Signup");
//         }, 2000);
//       } else if (settingsItem === "Password") {
//         if (!isReauthenticated) {
//           setMessage("Please confirm your password before proceeding.");
//           setIsMessageSuccess(false);
//           return;
//         }

//         // Password validation
//         if (
//           newValue.length < 8 ||
//           !/[A-Z]/.test(newValue) ||
//           !/[!@#$%^&*(),.?":{}|<>]/.test(newValue) ||
//           !/[0-9]/.test(newValue)
//         ) {
//           setMessage("Password does not meet requirements.");
//           setIsMessageSuccess(false);
//           return;
//         }

//         await updatePassword(user, newValue);
//         setMessage("Password has been changed successfully.");
//         setIsMessageSuccess(true);
//       }

//       setNewValue("");

//       setTimeout(() => {
//         setPopUp(false);
//       }, 1500);
//     } catch (error) {
//       setMessage(`${error.message}`);
//       setIsMessageSuccess(false);
//     }
//   };

//   // Delete user account
//   const handleDeleteAccount = async () => {
//     try {
//       await deleteUser(user);
//       setMessage("Account successfully deleted.");
//       setIsMessageSuccess(true);
//       setTimeout(() => navigate("/Home"), 2000);
//     } catch (error) {
//       setMessage(`${error.message}`);
//       setIsMessageSuccess(false);
//     }
//   };

//   return (
//     <div className="settings-container">
//       <div className="settings-card">
//         <h1 className="settings-heading">Settings</h1>
        

//         <div className="profile-section">
//           <div className="profile-picture-container">
//             {profilePicture ? (
//               <img
//                 src={profilePicture}
//                 alt="Profile"
//                 className="profile-picture"
//               />
//             ) : (
//               <div className="profile-initials">
//                 {getInitials(userData.name)}
//               </div>
//             )}
//           </div>
//           <label className="profile-upload-button">
//             <BsCloudUpload className="upload-icon" />
//             <span>Change Profile Picture</span>
//             <input
//               type="file"
//               accept="image/*"
//               onChange={handleImageChange}
//               className="hidden-file-input"
//             />
//           </label>
//         </div>

//         {message && (
//           <div className={`message-toast ${isMessageSuccess ? 'success' : 'error'}`}>
//             {message}
//           </div>
//         )}

//         {/* Settings Items */}
//         <div className="settings-items">
//           <div className="settings-item">
//             <div className="settings-item-content">
//               <FaUser className="settings-icon" />
//               <div className="settings-label">
//                 <span className="settings-label-title">Name</span>
//                 <span className="settings-label-value">{userData.name}</span>
//               </div>
//             </div>
//             <button
//               className="settings-button edit"
//               onClick={() => handleOpenPopUp("Name")}
//             >
//               Change
//             </button>
//           </div>

//           <div className="settings-item">
//             <div className="settings-item-content">
//               <FaLock className="settings-icon" />
//               <div className="settings-label">
//                 <span className="settings-label-title">Password</span>
//                 <span className="settings-label-value">••••••••</span>
//               </div>
//             </div>
//             <button
//               className="settings-button edit"
//               onClick={() => handleOpenPopUp("Password")}
//             >
//               Change
//             </button>
//           </div>

//           {/* Payment Item */}
//           <div className="settings-item">
//             <div className="settings-item-content">
//               <FaCreditCard className="settings-icon" />
//               <div className="settings-label">
//                 <span className="settings-label-title">Payment & Subscription</span>
//                 <span className="settings-label-value">Manage your billing information</span>
//               </div>
//             </div>
//             <button
//               className="settings-button edit"
//               onClick={handlePaymentHistory}
//             >
//               Manage
//             </button>
//           </div>

//           <div className="settings-item delete-item">
//             <div className="settings-item-content">
//               <FaTrashAlt className="settings-icon delete" />
//               <div className="settings-label">
//                 <span className="settings-label-title delete">Delete Account</span>
//                 <span className="settings-label-value small">This action cannot be undone</span>
//               </div>
//             </div>
//             <button
//               className="settings-button delete"
//               onClick={() => handleOpenPopUp("Delete Account")}
//             >
//               Delete
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Change Info Popup */}
//       {isPopUp && (
//         <div className="modal-overlay">
//           <div className="modal-content">
//             <div className="modal-header">
//               <h2>Change {settingsItem}</h2>
//               <button className="close-modal" onClick={handleCancel}>
//                 <FaTimes />
//               </button>
//             </div>
            
//             <div className="modal-body">
//               <div className="input-container">
//                 <input
//                   type={
//                     settingsItem === "Password" && !newPasswordVisible
//                       ? "password"
//                       : "text"
//                   }
//                   placeholder={`New ${settingsItem}`}
//                   className="settings-input"
//                   value={newValue}
//                   onChange={(e) => {
//                     setNewValue(e.target.value);
//                     if (settingsItem === "Password") {
//                       validatePassword(e.target.value);
//                     }
//                   }}
//                 />
//                 {settingsItem === "Password" && (
//                   <button
//                     type="button"
//                     className="visibility-toggle"
//                     onClick={() => setNewPasswordVisible(!newPasswordVisible)}
//                   >
//                     {newPasswordVisible ? <FaEyeSlash /> : <FaEye />}
//                   </button>
//                 )}
//               </div>
              
//               {settingsItem === "Password" && (
//                 <div className="password-requirements">
//                   <ul>
//                     <li className={signupPasswordRequirements.length ? "valid" : "invalid"}>
//                       <span className="check-icon">
//                         {signupPasswordRequirements.length ? <BsCheck2 /> : ""}
//                       </span>
//                       At least 8 characters long
//                     </li>
//                     <li className={signupPasswordRequirements.uppercase ? "valid" : "invalid"}>
//                       <span className="check-icon">
//                         {signupPasswordRequirements.uppercase ? <BsCheck2 /> : ""}
//                       </span>
//                       Contains at least one uppercase letter
//                     </li>
//                     <li className={signupPasswordRequirements.number ? "valid" : "invalid"}>
//                       <span className="check-icon">
//                         {signupPasswordRequirements.number ? <BsCheck2 /> : ""}
//                       </span>
//                       Contains at least one number
//                     </li>
//                     <li className={signupPasswordRequirements.specialcharacters ? "valid" : "invalid"}>
//                       <span className="check-icon">
//                         {signupPasswordRequirements.specialcharacters ? <BsCheck2 /> : ""}
//                       </span>
//                       Contains at least one special character
//                     </li>
//                   </ul>
//                 </div>
//               )}
//             </div>
            
//             <div className="modal-footer">
//               <button className="modal-button cancel" onClick={handleCancel}>
//                 Cancel
//               </button>
//               <button className="modal-button save" onClick={handleSave}>
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Password Confirmation Popup */}
//       {isConfirmPopUp && (
//         <div className="modal-overlay">
//           <div className="modal-content">
//             <div className="modal-header">
//               <h2>Confirm Your Password</h2>
//               <button className="close-modal" onClick={handleCancel}>
//                 <FaTimes />
//               </button>
//             </div>
            
//             <div className="modal-body">
//               <div className="input-container">
//                 <input
//                   type={passwordVisible ? "text" : "password"}
//                   placeholder="Enter your password"
//                   value={passwordConfirm}
//                   onChange={(e) => setPasswordConfirm(e.target.value)}
//                   className="settings-input"
//                 />
//                 <button
//                   type="button"
//                   className="visibility-toggle"
//                   onClick={() => setPasswordVisible(!passwordVisible)}
//                 >
//                   {passwordVisible ? <FaEyeSlash /> : <FaEye />}
//                 </button>
//               </div>
//             </div>
            
//             <div className="modal-footer">
//               <button className="modal-button cancel" onClick={handleCancel}>
//                 Cancel
//               </button>
//               <button className="modal-button save" onClick={handleConfirmPassword}>
//                 Confirm
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete Account Confirmation */}
//       {isDeletePopUp && (
//         <div className="modal-overlay">
//           <div className="modal-content delete-modal">
//             <div className="modal-header">
//               <h2>Delete Account</h2>
//               <button className="close-modal" onClick={handleCancel}>
//                 <FaTimes />
//               </button>
//             </div>
            
//             <div className="modal-body">
//               <div className="delete-warning">
//                 <FaTrashAlt className="delete-icon" />
//                 <p>
//                   Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
//                 </p>
//               </div>
//             </div>
            
//             <div className="modal-footer">
//               <button className="modal-button cancel" onClick={handleCancel}>
//                 Cancel
//               </button>
//               <button className="modal-button delete" onClick={handleDeleteAccount}>
//                 Delete Account
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Settings;




//updated settings 


import React, { useState, useEffect, useContext } from "react";
import { auth, storage } from "../config/firebase"; // import firebase auth and storage
import {
  sendEmailVerification,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth"; // these are auth functions from firebase
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // these are for uploading images
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaTrashAlt,
  FaLock,
  FaTimes,
} from "react-icons/fa";
import { BsCloudUpload, BsCheck2 } from "react-icons/bs";
import { ProfilePictureNameChange } from "./ProfilePictureNameChange"; // to get the name or profile pic)
import "./Settings.css"; // import the css file

function Settings() {
  const navigate = useNavigate();
  const user = auth.currentUser; // get the logged-in user
  const [isPopUp, setPopUp] = useState(false); // this is for the change popup
  const [isDeletePopUp, setIsDeletePopUp] = useState(false); // this is for delete account popup
  const [settingsItem, setSettingsItem] = useState(""); // this is for the item user wants to change either name, or password
  const [newValue, setNewValue] = useState(""); // this is for the input field value
  const [passwordConfirm, setPasswordConfirm] = useState(""); // this is for the user to confirm their password
  const [passwordVisible, setPasswordVisible] = useState(false); // it shows or hide the user's confirm password
  const [newPasswordVisible, setNewPasswordVisible] = useState(false); // it shows or hide the user's new password
  const [isConfirmPopUp, setIsConfirmPopUp] = useState(false); // this controls the password confirm popup
  const [message, setMessage] = useState(""); // this shows either success or error messages
  const [isReauthenticated, setIsReauthenticated] = useState(false); // true if user confirm their password
  const [isMessageSuccess, setIsMessageSuccess] = useState(false); // true if last action was successful

  // get and set user name and profile pic using context
  const { userData, setUserData, profilePicture, setProfilePicture } =
    useContext(ProfilePictureNameChange);

  // this stores the password requirements user met
  const [signupPasswordRequirements, setSignupPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialcharacters: false,
  });

  // check to ensure that password meets all requirements
  const validatePassword = (password) => {
    const lengthRequirement = password.length >= 8;
    const uppercaseRegex = /[A-Z]/;
    const numberRegex = /[0-9]/;
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

    setSignupPasswordRequirements({
      length: lengthRequirement,
      uppercase: uppercaseRegex.test(password),
      number: numberRegex.test(password),
      specialcharacters: specialCharRegex.test(password),
    });
  };

  // checks user's to ensure that it is valid and from a valid domain
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const allowedDomains = [
      "gmail.com",
      "outlook.com",
      "yahoo.com",
      "hotmail.com",
      "icloud.com",
    ];

    if (!emailRegex.test(email)) {
      return false;
    }

    const domain = email.split("@")[1];
    if (!allowedDomains.includes(domain)) {
      return false;
    }

    return true;
  };

  // when it loads,fill name (user's initial) or profile picture
  useEffect(() => {
    if (user) {
      setUserData({ name: user.displayName, email: user.email });
      setProfilePicture(user.photoURL || null);
    }
  }, [user]);

  // after message (either error or success message) appears, clear it after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // when user selects a picture as a profilepicture it saves in the firebase
  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(storageRef, file);

        const downloadURL = await getDownloadURL(storageRef);
        await updateProfile(user, { photoURL: downloadURL });

        setProfilePicture(downloadURL);
        setMessage("Profile picture updated successfully!");
        setIsMessageSuccess(true);
      } catch (error) {
        setMessage(`Error uploading image: ${error.message}`);
        setIsMessageSuccess(false);
      }
    } else {
      setMessage("No file selected.");
      setIsMessageSuccess(false);
    }
  };

  // if user does not have a profile picture, show user's initials instead
  const getInitials = (name) => {
    if (!name) return "";
    const names = name.split(" ");
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  // opens the correct popup depending on what the user wants to change either name or password
  const handleOpenPopUp = (field) => {
    setSettingsItem(field);
    setNewValue("");
    setMessage("");
    setIsMessageSuccess(false);

    if (["Delete Account", "Email Address", "Password"].includes(field)) {
      setIsConfirmPopUp(true); // user as to enter and confirm their current password first
      setIsReauthenticated(false);
    } else {
      setPopUp(true); // else open the input popup
    }
  };

  // clicking cancel closes all popups
  const handleCancel = () => {
    setPopUp(false);
    setIsConfirmPopUp(false);
    setIsDeletePopUp(false);
    setNewValue("");
  };

  // confirm user’s password before changing password or deleting account
  const handleConfirmPassword = async () => {
    try {
      if (!passwordConfirm) {
        setMessage("Please enter your current password.");
        setIsMessageSuccess(false);
        return;
      }

      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        passwordConfirm
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      setIsReauthenticated(true); // Reauthenticated done
      setIsConfirmPopUp(false); // the password confirm popup is closed
      setPasswordConfirm(""); // user can reset

      if (settingsItem === "Delete Account") {
        setIsDeletePopUp(true); // the delete confirmation opens
      } else {
        setPopUp(true); // the input box is opened
      }
    } catch (error) {
      setMessage("Incorrect password. Please try again.");
      setIsMessageSuccess(false);
    }
  };

  //this is for saving changes (name/password)
  const handleSave = async () => {
    try {
      if (settingsItem === "Name") {
        // if it change name
        await updateProfile(user, { displayName: newValue });
        setUserData((prev) => ({ ...prev, name: newValue }));
        setMessage("Name has been changed successfully.");
        setIsMessageSuccess(true);
      } else if (settingsItem === "Email Address") {
        if (!isReauthenticated) {
          setMessage("Please confirm your password before proceeding.");
          setIsMessageSuccess(false);
          return;
        }

        if (!validateEmail(newValue)) {
          setMessage(
            "Please enter a valid email address with a supported domain."
          );
          setIsMessageSuccess(false);
          return;
        }

        if (!user.emailVerified) {
          setMessage(
            "Please verify your current email address. A verification email has been sent."
          );
          setIsMessageSuccess(false);
          await sendEmailVerification(user);
          return;
        }

        await updateEmail(user, newValue);
        setMessage("Email updated! Please log in again.");
        setIsMessageSuccess(true);
        setTimeout(() => {
          auth.signOut();
          navigate("/Signup");
        }, 2000);
      } else if (settingsItem === "Password") {
        if (!isReauthenticated) {
          setMessage("Please confirm your password before proceeding.");
          setIsMessageSuccess(false);
          return;
        }

        // it checks that the new password meet all the password requirements
        if (
          newValue.length < 8 ||
          !/[A-Z]/.test(newValue) ||
          !/[!@#$%^&*(),.?":{}|<>]/.test(newValue) ||
          !/[0-9]/.test(newValue)
        ) {
          setMessage("Password does not meet requirements.");
          setIsMessageSuccess(false);
          return;
        }

        await updatePassword(user, newValue);
        setMessage("Password has been changed successfully.");
        setIsMessageSuccess(true);
      }

      setNewValue(""); // it is reset the input

      setTimeout(() => {
        setPopUp(false);
      }, 1500);
    } catch (error) {
      setMessage(`${error.message}`); // the popup is closed
      setIsMessageSuccess(false);
    }
  };

  // a user deleting an account
  const handleDeleteAccount = async () => {
    try {
      await deleteUser(user);
      setMessage("Account successfully deleted.");
      setIsMessageSuccess(true);
      setTimeout(() => navigate("/Home"), 2000);
    } catch (error) {
      setMessage(`${error.message}`);
      setIsMessageSuccess(false);
    }
  };

  return (
    <div className="settings-container">
      {/* the settings where everything is displayed name,password and deleting an account and changing profile picture */}
      <div className="settings-card">
        <h1 className="settings-heading">Settings</h1>

        {/* this shows and update the profile picture */}
        <div className="profile-section">
          <div className="profile-picture-container">
            {profilePicture ? (
              // if the user has a profile picture it should be displayed
              <img
                src={profilePicture}
                alt="Profile"
                className="profile-picture"
              />
            ) : (
              // if no profile picture the user's initials should be displayed
              <div className="profile-initials">
                {getInitials(userData.name)}
              </div>
            )}
          </div>
          {/* The profile picture upload input */}
          <label className="profile-upload-button">
            <BsCloudUpload className="upload-icon" />
            <span>Change Profile Picture</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden-file-input"
            />
          </label>
        </div>

        {/* this will show the message either error or success */}
        {message && (
          <div
            className={`message-toast ${
              isMessageSuccess ? "success" : "error"
            }`}
          >
            {message}
          </div>
        )}

        {/* The settings to change name, password and delete account */}
        <div className="settings-items">
          <div className="settings-item">
            <div className="settings-item-content">
              <FaUser className="settings-icon" />
              <div className="settings-label">
                <span className="settings-label-title">Name</span>
                <span className="settings-label-value">{userData.name}</span>
              </div>
            </div>
            {/* this is the change name button */}
            <button
              className="settings-button edit"
              onClick={() => handleOpenPopUp("Name")}
            >
              Change
            </button>
          </div>

          <div className="settings-item">
            <div className="settings-item-content">
              <FaLock className="settings-icon" />
              <div className="settings-label">
                <span className="settings-label-title">Password</span>
                <span className="settings-label-value">••••••••</span>
              </div>
            </div>
            {/* this is the change password button */}
            <button
              className="settings-button edit"
              onClick={() => handleOpenPopUp("Password")}
            >
              Change
            </button>
          </div>

          <div className="settings-item delete-item">
            <div className="settings-item-content">
              <FaTrashAlt className="settings-icon delete" />
              <div className="settings-label">
                <span className="settings-label-title delete">
                  Delete Account
                </span>
                <span className="settings-label-value small">
                  This action cannot be undone
                </span>
              </div>
            </div>
            <button
              className="settings-button delete"
              onClick={() => handleOpenPopUp("Delete Account")}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* This is the Change Name and Password Modal */}
      {isPopUp && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Change {settingsItem}</h2>
              <button className="close-modal" onClick={handleCancel}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {/* this the input for the new value */}
              <div className="input-container">
                <input
                  type={
                    settingsItem === "Password" && !newPasswordVisible
                      ? "password"
                      : "text"
                  }
                  placeholder={`New ${settingsItem}`}
                  className="settings-input"
                  value={newValue}
                  onChange={(e) => {
                    setNewValue(e.target.value);
                    if (settingsItem === "Password") {
                      validatePassword(e.target.value);
                    }
                  }}
                />

                {/* it will toggle the password so it will be visible when clicked */}
                {settingsItem === "Password" && (
                  <button
                    type="button"
                    className="visibility-toggle"
                    onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                  >
                    {newPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                  </button>
                )}
              </div>

              {/* this shows the password requirments when the user is changing their password */}
              {settingsItem === "Password" && (
                <div className="password-requirements">
                  <ul>
                    {/* the password length */}
                    <li
                      className={
                        signupPasswordRequirements.length ? "valid" : "invalid"
                      }
                    >
                      <span className="check-icon">
                        {signupPasswordRequirements.length ? <BsCheck2 /> : ""}
                      </span>
                      At least 8 characters long
                    </li>
                    {/* the password uppercase */}
                    <li
                      className={
                        signupPasswordRequirements.uppercase
                          ? "valid"
                          : "invalid"
                      }
                    >
                      <span className="check-icon">
                        {signupPasswordRequirements.uppercase ? (
                          <BsCheck2 />
                        ) : (
                          ""
                        )}
                      </span>
                      Contains at least one uppercase letter
                    </li>
                    {/* the password's number */}
                    <li
                      className={
                        signupPasswordRequirements.number ? "valid" : "invalid"
                      }
                    >
                      <span className="check-icon">
                        {signupPasswordRequirements.number ? <BsCheck2 /> : ""}
                      </span>
                      Contains at least one number
                    </li>
                    {/* the password special character */}
                    <li
                      className={
                        signupPasswordRequirements.specialcharacters
                          ? "valid"
                          : "invalid"
                      }
                    >
                      <span className="check-icon">
                        {signupPasswordRequirements.specialcharacters ? (
                          <BsCheck2 />
                        ) : (
                          ""
                        )}
                      </span>
                      Contains at least one special character
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* the save and cancel */}
            <div className="modal-footer">
              <button className="modal-button cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button className="modal-button save" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* the password confirmation popup */}
      {isConfirmPopUp && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Your Password</h2>
              <button className="close-modal" onClick={handleCancel}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="input-container">
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Enter your password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="settings-input"
                />
                <button
                  type="button"
                  className="visibility-toggle"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-button cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button
                className="modal-button save"
                onClick={handleConfirmPassword}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* the delete confirmation popup */}
      {isDeletePopUp && (
        <div className="modal-overlay">
          <div className="modal-content settingsdelete-modal">
            <div className="modal-header">
              <h2>Delete Account</h2>
              <button className="close-modal" onClick={handleCancel}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="delete-warning">
                <FaTrashAlt className="delete-icon" />
                <p>
                  Are you sure you want to delete your account? This action
                  cannot be undone and all your data will be permanently lost.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-button cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button
                className="modal-button delete"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;