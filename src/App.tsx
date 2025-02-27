import { Outlet } from "react-router-dom";
import "./App.css";
import { AudioProvider } from "./contexts/AudioContext";

const App = () => {
  return (
    <div>
      <AudioProvider>
        <Outlet />
      </AudioProvider>
    </div>
  );
};

export default App;
