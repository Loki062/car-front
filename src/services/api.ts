import axios from "axios";

export const api = axios.create({
  baseURL: "https://car-back-alpha.vercel.app/",
});
