import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import Results from './pages/Results';
import GameManagement from './pages/GameManagement';
import Profile from './pages/Profile';
import PlayerManagement from './pages/PlayerManagement';
import Chat from './pages/Chat';
import PrizeManagement from './pages/PrizeManagement';
import Communication from './pages/Communication';
import Home from './pages/Home';
import GamePredictions from './pages/GamePredictions';
import ManualPredictions from './pages/ManualPredictions';
import SuperAdminSetup from './pages/SuperAdminSetup';
import Assistant from './pages/Assistant';
import Conversation from './pages/Conversation';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Games": Games,
    "Results": Results,
    "GameManagement": GameManagement,
    "Profile": Profile,
    "PlayerManagement": PlayerManagement,
    "Chat": Chat,
    "PrizeManagement": PrizeManagement,
    "Communication": Communication,
    "Home": Home,
    "GamePredictions": GamePredictions,
    "ManualPredictions": ManualPredictions,
    "SuperAdminSetup": SuperAdminSetup,
    "Assistant": Assistant,
    "Conversation": Conversation,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};