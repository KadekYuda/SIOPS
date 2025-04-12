import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, Edit, Save, X } from "lucide-react";
import api from "../../../service/api";

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    role: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get complete profile data in a single call
        const response = await api.get("/users/profile");
        const userData = response.data.user ?? response.data;
        
        console.log("Complete profile data:", userData);
        
        setUserData({
          user_id: userData.user_id || "",
          name: userData.name || "No name",
          email: userData.email || "No email",
          role: userData.role || "No role",
          phone_number: userData.phone_number || "No phone",
          status: userData.status || "active"
        });

        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone_number: userData.phone_number || "",
          role: userData.role || "",
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
  
    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/users/${userData.user_id}`,
        formData,
      );

      const updatedUser = response.data.user;

      setUserData(updatedUser);
      setFormData({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone_number: updatedUser.phone_number || "",
        role: updatedUser.role || "",
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.response?.data?.msg || "Error updating profile");
    }
  };

  if (!userData) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full px-4 py-8 pt-20">
      <div className="bg-white shadow-lg rounded-2xl overflow-hidden w-full">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{userData.name}</h2>
              <p className="text-white/80 text-sm">{userData.role}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(!isEditing)}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-all"
          >
            {isEditing ? <X size={24} /> : <Edit size={24} />}
          </motion.button>
        </div>

        <div className="p-8">
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-3 flex items-center">
                    <User className="mr-3 text-gray-500" size={20} />
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-3 flex items-center">
                    <Mail className="mr-3 text-gray-500" size={20} />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-3 flex items-center">
                    <Phone className="mr-3 text-gray-500" size={20} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-3 flex items-center">
                    <Lock className="mr-3 text-gray-500" size={20} />
                    Role
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    readOnly
                    className="w-full px-4 py-3 border rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <motion.button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <X size={20} className="mr-2 inline" />
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  <Save size={20} className="mr-2 inline" />
                  Save Changes
                </motion.button>
              </div>
            </form>
          ) :(
            <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
              <User className="text-blue-500" size={24} />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-base font-semibold">{userData.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
              <Mail className="text-green-500" size={24} />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base font-semibold">{userData.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
              <Phone className="text-purple-500" size={24} />
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="text-base font-semibold">{userData.phone_number}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
              <Lock className="text-red-500" size={24} />
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-base font-semibold">{userData.role}</p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;