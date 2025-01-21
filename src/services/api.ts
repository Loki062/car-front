import axios from "axios";

export const api = axios.create({
  baseURL: "https://car-back-two.vercel.app/",
});
