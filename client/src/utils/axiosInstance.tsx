import axios from "axios";

type EnvMode = "local" | "dev" | "prod";

const env = import.meta.env.REACT_APP_ENV as EnvMode | undefined;
let baseURL: string;

switch (env) {
    case "local":
        baseURL = "http://localhost:3000/api";
        break;
    case "dev":
        if (!process.env.API_URL_DEV) {
            throw new Error(
                "REACT_APP_API_URL is not defined for production mode."
            );
        }
        baseURL = process.env.API_URL_DEV;
        break;
    case "prod":
        if (!process.env.API_URL_PROD) {
            throw new Error(
                "REACT_APP_API_URL is not defined for production mode."
            );
        }
        baseURL = process.env.API_URL_PROD;
        break;
    default:
        console.warn("Unknown REACT_APP_ENV. Defaulting to local mode.");
        baseURL = "http://localhost:3000/api";
}

const API = axios.create({
    baseURL,
    // timeout: 10000, // 10 seconds timeout
    withCredentials: true, // Include credentials for Cookies
});

export default API;
