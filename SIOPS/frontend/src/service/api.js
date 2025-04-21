import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
// console.log("API URL :", API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
});



export default api;