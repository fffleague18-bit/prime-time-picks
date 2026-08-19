import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Message } from "@/entities/Message";
import { Trophy, Calendar, BarChart3, Home, Settings, User as UserIcon, Users, MessageCircle, Gift, LogOut, Mail, Menu, UserPlus, Bot, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SeasonSwitcher from "@/components/shared/SeasonSwitcher";

export default function Layout({ children }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        // Check for unread messages
        const messages = await Message.list('-created_date', 1);
        if (messages.length > 0 && user.last_seen_chat) {
          const latestMessageDate = new Date(messages[0].created_date);
          const lastSeenDate = new Date(user.last_seen_chat);
          setHasUnreadMessages(latestMessageDate > lastSeenDate);
        } else if (messages.length > 0 && !user.last_seen_chat) {
          setHasUnreadMessages(true);
        }
      } catch (e) {
        // Not logged in
      }
    };
    fetchUser();
  }, [location.pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await User.logout();
    window.location.reload();
  };

  const NavLink = ({ href, icon: Icon, children, showDot }) => (
    <Link to={href}>
      <Button variant={location.pathname === href ? "secondary" : "ghost"} className="w-full justify-start gap-3 relative">
        <Icon className="w-5 h-5" />
        {children}
        {showDot && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
        )}
      </Button>
    </Link>
  );

  const navigationItems = [
    { href: createPageUrl("Dashboard"), icon: Home, label: "Dashboard" },
    { href: createPageUrl("SuperBowlSquares"), icon: Trophy, label: "Super Bowl Squares ($5)" },
    { href: createPageUrl("SuperBowlSquares10"), icon: Trophy, label: "Super Bowl Squares ($10)" },
    { href: createPageUrl("Games"), icon: Calendar, label: "Games" },
    { href: createPageUrl("Results"), icon: BarChart3, label: "Results" },
    { href: createPageUrl("Chat"), icon: MessageCircle, label: "Chat", showDot: hasUnreadMessages },
    { href: createPageUrl("Assistant"), icon: Bot, label: "Assistant" },
    { href: createPageUrl("Profile"), icon: UserIcon, label: "Profile" },
  ];

  // Define admin navigation based on admin level
  const getAdminNavItems = (adminLevel) => {
    // Level 2 (Admin 2) items
    const admin2Items = [
      { href: createPageUrl("GameManagement"), icon: Settings, label: "Game Management" },
      { href: createPageUrl("SuperBowlAdmin"), icon: Trophy, label: "Super Bowl Admin ($5)" },
      { href: createPageUrl("SuperBowlAdmin10"), icon: Trophy, label: "Super Bowl Admin ($10)" },
      { href: createPageUrl("PlayerManagement"), icon: Users, label: "Player Management" },
      { href: createPageUrl("Communication"), icon: Mail, label: "Communication" },
    ];

    // Level 3 (Super Admin) gets additional items
    const superAdminItems = [
      { href: createPageUrl("PrizeManagement"), icon: Gift, label: "Prize Management" },
      { href: createPageUrl("ManualPredictions"), icon: UserPlus, label: "Manual Predictions" },
      { href: createPageUrl("SuperAdminSetup"), icon: ShieldCheck, label: "Super Admin Setup" },
    ];

    if (adminLevel >= 3) {
      return [...admin2Items, ...superAdminItems];
    } else if (adminLevel >= 2) {
      return admin2Items; // Admin 2 only gets the base items, no setup page
    }
    return [];
  };
  
  const adminLevel = currentUser?.super_admin_level || 0;
  const isAdmin = adminLevel >= 1; // Any admin level
  const isSuperAdmin = adminLevel >= 3; // Level 3
  const isAdmin2 = adminLevel === 2; // Level 2

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-emerald-500" />
          <h2 className="font-bold text-xl">Football League</h2>
        </div>
      </div>
      <SeasonSwitcher />
      <nav className="flex-1 p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-500 px-3">Menu</p>
        {navigationItems.map(item => <NavLink key={item.label} href={item.href} icon={item.icon} showDot={item.showDot}>{item.label}</NavLink>)}
        
        {/* Show admin section if user has Admin 2 or Super Admin level */}
        {adminLevel >= 2 && (
          <>
            <p className="text-sm font-semibold text-slate-500 px-3 pt-4">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </p>
            {getAdminNavItems(adminLevel).map(item => 
              <NavLink key={item.label} href={item.href} icon={item.icon}>{item.label}</NavLink>
            )}
          </>
        )}
      </nav>
      <div className="p-4 border-t">
        {currentUser && (
          <div className="flex items-center justify-between">
             <div>
               <div className="font-semibold">{currentUser.display_name || currentUser.full_name}</div>
               {isSuperAdmin && <div className="text-xs text-emerald-600 font-bold">Super Admin</div>}
               {isAdmin2 && <div className="text-xs text-blue-600 font-bold">Admin 2</div>}
             </div>
             <Button variant="ghost" size="icon" onClick={handleLogout} disabled={isLoggingOut}>
               <LogOut className="w-5 h-5"/>
             </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex bg-slate-100">
      <aside className="w-64 border-r bg-white hidden lg:block">
        <SidebarContent />
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="p-4 bg-white border-b lg:hidden flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon"><Menu className="w-5 h-5"/></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64"><SidebarContent /></SheetContent>
          </Sheet>
          <Trophy className="w-6 h-6 text-emerald-500" />
          <h1 className="font-bold text-lg">Football League</h1>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}