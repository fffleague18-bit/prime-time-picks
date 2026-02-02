/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
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
import SuperBowlAdmin from './pages/SuperBowlAdmin';
import SuperBowlAdmin10 from './pages/SuperBowlAdmin10';
import SuperBowlSquares from './pages/SuperBowlSquares';
import SuperBowlSquares10 from './pages/SuperBowlSquares10';
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
    "SuperBowlAdmin": SuperBowlAdmin,
    "SuperBowlAdmin10": SuperBowlAdmin10,
    "SuperBowlSquares": SuperBowlSquares,
    "SuperBowlSquares10": SuperBowlSquares10,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};