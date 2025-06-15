import { SocketProvider } from "@/context/SocketContext";
import "@/styles/globals.css";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }) {
  return (
    <>
      <SocketProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <Component {...pageProps} />
      </SocketProvider>
    </>
  );
}
