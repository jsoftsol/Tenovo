import axios from "axios";

export default function getErrorMessage(error: unknown, defaultErrorMessage: string = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || defaultErrorMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}