import axios from "axios";

export const api = axios.create({
  baseURL: "https://carros-back.vercel.app/",
});
