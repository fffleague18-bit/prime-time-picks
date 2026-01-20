import Assistant from './pages/Assistant';
import Chat from './pages/Chat';
import Communication from './pages/Communication';
import Conversation from './pages/Conversation';
import Dashboard from './pages/Dashboard';
import GameManagement from './pages/GameManagement';
import GamePredictions from './pages/GamePredictions';
import Games from './pages/Games';
import Home from './pages/Home';
import ManualPredictions from './pages/ManualPredictions';
import PlayerManagement from './pages/PlayerManagement';
import PrizeManagement from './pages/PrizeManagement';
import Profile from './pages/Profile';
import Results from './pages/Results';
import SuperAdminSetup from './pages/SuperAdminSetup';
import SuperBowlSquares from './pages/SuperBowlSquares';
import SuperBowlAdmin from './pages/SuperBowlAdmin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Assistant": Assistant,
    "Chat": Chat,
    "Communication": Communication,
    "Conversation": Conversation,
    "Dashboard": Dashboard,
    "GameManagement": GameManagement,
    "GamePredictions": GamePredictions,
    "Games": Games,
    "Home": Home,
    "ManualPredictions": ManualPredictions,
    "PlayerManagement": PlayerManagement,
    "PrizeManagement": PrizeManagement,
    "Profile": Profile,
    "Results": Results,
    "SuperAdminSetup": SuperAdminSetup,
    "SuperBowlSquares": SuperBowlSquares,
    "SuperBowlAdmin": SuperBowlAdmin,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};